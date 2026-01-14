using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FrugalBites.Data;
using FrugalBites.Models.Entities;
using FrugalBites.Models.Enums;
using Stripe;

namespace FrugalBites.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PaymentsController> _logger;
    private readonly IConfiguration _configuration;

    public PaymentsController(
        ApplicationDbContext context,
        ILogger<PaymentsController> logger,
        IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _configuration = configuration;

        // Configure Stripe
        StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"];
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        return Guid.Parse(userIdClaim!);
    }

    /// <summary>
    /// Get Stripe publishable key for client-side initialization
    /// </summary>
    [HttpGet("config")]
    public ActionResult<PaymentConfigResponse> GetPaymentConfig()
    {
        var publishableKey = _configuration["Stripe:PublishableKey"];
        return Ok(new PaymentConfigResponse { PublishableKey = publishableKey });
    }

    /// <summary>
    /// Create a PaymentIntent for an order
    /// </summary>
    [HttpPost("create-payment-intent")]
    public async Task<ActionResult<PaymentIntentResponse>> CreatePaymentIntent([FromBody] CreatePaymentIntentRequest request)
    {
        var userId = GetCurrentUserId();

        _logger.LogInformation("Creating payment intent for order {OrderId} by user {UserId}", request.OrderId, userId);

        // Get the order
        var order = await _context.Orders
            .Include(o => o.Offer)
            .Include(o => o.Merchant)
            .FirstOrDefaultAsync(o => o.OrderId == request.OrderId && o.UserId == userId);

        if (order == null)
        {
            _logger.LogWarning("Payment intent creation failed: Order {OrderId} not found", request.OrderId);
            return NotFound("Order not found");
        }

        if (order.PaymentStatus == PaymentStatus.COMPLETED)
        {
            _logger.LogWarning("Payment intent creation failed: Order {OrderId} already paid", request.OrderId);
            return BadRequest("This order has already been paid");
        }

        if (order.OrderStatus == OrderStatus.CANCELLED)
        {
            _logger.LogWarning("Payment intent creation failed: Order {OrderId} is cancelled", request.OrderId);
            return BadRequest("Cannot pay for a cancelled order");
        }

        // If there's an existing PaymentIntent, retrieve it
        if (!string.IsNullOrEmpty(order.StripePaymentIntentId))
        {
            try
            {
                var existingIntent = await new PaymentIntentService().GetAsync(order.StripePaymentIntentId);
                if (existingIntent.Status == "requires_payment_method" || 
                    existingIntent.Status == "requires_confirmation" ||
                    existingIntent.Status == "requires_action")
                {
                    _logger.LogInformation("Returning existing PaymentIntent {PaymentIntentId}", existingIntent.Id);
                    return Ok(new PaymentIntentResponse
                    {
                        ClientSecret = existingIntent.ClientSecret,
                        PaymentIntentId = existingIntent.Id,
                        Amount = existingIntent.Amount,
                        Currency = existingIntent.Currency
                    });
                }
            }
            catch (StripeException ex)
            {
                _logger.LogWarning(ex, "Could not retrieve existing PaymentIntent, creating new one");
            }
        }

        // Create a new PaymentIntent
        var options = new PaymentIntentCreateOptions
        {
            Amount = (long)(order.TotalPrice * 100), // Convert to cents
            Currency = "usd",
            AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
            {
                Enabled = true,
            },
            Metadata = new Dictionary<string, string>
            {
                { "orderId", order.OrderId.ToString() },
                { "userId", userId.ToString() },
                { "merchantId", order.MerchantId.ToString() },
                { "offerId", order.OfferId.ToString() }
            },
            Description = $"FrugalBites order: {order.Offer.FoodName} x{order.Quantity}"
        };

        // If merchant has Stripe Connect account, set up for split payment
        if (!string.IsNullOrEmpty(order.Merchant.StripeAccountId))
        {
            // Calculate platform fee (using merchant's commission rate)
            var platformFee = (long)(order.TotalPrice * 100 * (decimal)order.Merchant.CommissionRate);
            options.ApplicationFeeAmount = platformFee;
            options.TransferData = new PaymentIntentTransferDataOptions
            {
                Destination = order.Merchant.StripeAccountId
            };
        }

        try
        {
            var service = new PaymentIntentService();
            var paymentIntent = await service.CreateAsync(options);

            // Save PaymentIntent ID to order
            order.StripePaymentIntentId = paymentIntent.Id;
            order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("PaymentIntent {PaymentIntentId} created for order {OrderId}", 
                paymentIntent.Id, order.OrderId);

            return Ok(new PaymentIntentResponse
            {
                ClientSecret = paymentIntent.ClientSecret,
                PaymentIntentId = paymentIntent.Id,
                Amount = paymentIntent.Amount,
                Currency = paymentIntent.Currency
            });
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error creating PaymentIntent for order {OrderId}", order.OrderId);
            return StatusCode(500, $"Payment processing error: {ex.Message}");
        }
    }

    /// <summary>
    /// Confirm payment was successful (called after client-side confirmation)
    /// </summary>
    [HttpPost("confirm-payment")]
    public async Task<ActionResult<PaymentConfirmationResponse>> ConfirmPayment([FromBody] ConfirmPaymentRequest request)
    {
        var userId = GetCurrentUserId();

        _logger.LogInformation("Confirming payment {PaymentIntentId} for user {UserId}", 
            request.PaymentIntentId, userId);

        // Get the order by PaymentIntentId
        var order = await _context.Orders
            .Include(o => o.Offer)
            .Include(o => o.Merchant)
            .FirstOrDefaultAsync(o => o.StripePaymentIntentId == request.PaymentIntentId && o.UserId == userId);

        if (order == null)
        {
            _logger.LogWarning("Payment confirmation failed: Order with PaymentIntent {PaymentIntentId} not found", 
                request.PaymentIntentId);
            return NotFound("Order not found");
        }

        // Verify payment status with Stripe
        try
        {
            var service = new PaymentIntentService();
            var paymentIntent = await service.GetAsync(request.PaymentIntentId);

            if (paymentIntent.Status == "succeeded")
            {
                order.PaymentStatus = PaymentStatus.COMPLETED;
                order.OrderStatus = OrderStatus.CONFIRMED;
                order.PaymentMethodId = paymentIntent.PaymentMethodId;
                order.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Payment confirmed for order {OrderId}, PaymentIntent {PaymentIntentId}", 
                    order.OrderId, paymentIntent.Id);

                return Ok(new PaymentConfirmationResponse
                {
                    Success = true,
                    OrderId = order.OrderId,
                    OrderStatus = order.OrderStatus.ToString(),
                    PaymentStatus = order.PaymentStatus.ToString(),
                    Message = "Payment successful! Your order has been confirmed."
                });
            }
            else
            {
                _logger.LogWarning("PaymentIntent {PaymentIntentId} status is {Status}, not succeeded", 
                    paymentIntent.Id, paymentIntent.Status);
                return Ok(new PaymentConfirmationResponse
                {
                    Success = false,
                    OrderId = order.OrderId,
                    OrderStatus = order.OrderStatus.ToString(),
                    PaymentStatus = order.PaymentStatus.ToString(),
                    Message = $"Payment not completed. Status: {paymentIntent.Status}"
                });
            }
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error confirming payment {PaymentIntentId}", request.PaymentIntentId);
            return StatusCode(500, $"Payment verification error: {ex.Message}");
        }
    }

    /// <summary>
    /// Stripe webhook endpoint for payment events
    /// </summary>
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> HandleWebhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var webhookSecret = _configuration["Stripe:WebhookSecret"];

        try
        {
            var stripeEvent = EventUtility.ConstructEvent(
                json,
                Request.Headers["Stripe-Signature"],
                webhookSecret
            );

            _logger.LogInformation("Received Stripe webhook: {EventType}", stripeEvent.Type);

            switch (stripeEvent.Type)
            {
                case "payment_intent.succeeded":
                    var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
                    await HandlePaymentSucceeded(paymentIntent!);
                    break;

                case "payment_intent.payment_failed":
                    var failedIntent = stripeEvent.Data.Object as PaymentIntent;
                    await HandlePaymentFailed(failedIntent!);
                    break;

                default:
                    _logger.LogInformation("Unhandled Stripe event type: {EventType}", stripeEvent.Type);
                    break;
            }

            return Ok();
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe webhook error");
            return BadRequest($"Webhook error: {ex.Message}");
        }
    }

    private async Task HandlePaymentSucceeded(PaymentIntent paymentIntent)
    {
        _logger.LogInformation("Handling payment_intent.succeeded for {PaymentIntentId}", paymentIntent.Id);

        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.StripePaymentIntentId == paymentIntent.Id);

        if (order != null && order.PaymentStatus != PaymentStatus.COMPLETED)
        {
            order.PaymentStatus = PaymentStatus.COMPLETED;
            order.OrderStatus = OrderStatus.CONFIRMED;
            order.PaymentMethodId = paymentIntent.PaymentMethodId;
            order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Order {OrderId} marked as paid via webhook", order.OrderId);
        }
    }

    private async Task HandlePaymentFailed(PaymentIntent paymentIntent)
    {
        _logger.LogInformation("Handling payment_intent.payment_failed for {PaymentIntentId}", paymentIntent.Id);

        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.StripePaymentIntentId == paymentIntent.Id);

        if (order != null)
        {
            order.PaymentStatus = PaymentStatus.FAILED;
            order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogWarning("Order {OrderId} payment failed via webhook", order.OrderId);
        }
    }

    /// <summary>
    /// Request a refund for an order
    /// </summary>
    [HttpPost("refund")]
    public async Task<ActionResult<RefundResponse>> RequestRefund([FromBody] RefundRequest request)
    {
        var userId = GetCurrentUserId();

        _logger.LogInformation("Refund requested for order {OrderId} by user {UserId}", request.OrderId, userId);

        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.OrderId == request.OrderId && o.UserId == userId);

        if (order == null)
        {
            return NotFound("Order not found");
        }

        if (order.PaymentStatus != PaymentStatus.COMPLETED)
        {
            return BadRequest("Cannot refund an unpaid order");
        }

        if (string.IsNullOrEmpty(order.StripePaymentIntentId))
        {
            return BadRequest("No payment information found for this order");
        }

        try
        {
            var refundOptions = new RefundCreateOptions
            {
                PaymentIntent = order.StripePaymentIntentId,
                Reason = RefundReasons.RequestedByCustomer,
                Metadata = new Dictionary<string, string>
                {
                    { "orderId", order.OrderId.ToString() },
                    { "reason", request.Reason ?? "Customer requested" }
                }
            };

            var refundService = new RefundService();
            var refund = await refundService.CreateAsync(refundOptions);

            order.PaymentStatus = PaymentStatus.REFUNDED;
            order.OrderStatus = OrderStatus.CANCELLED;
            order.CancelledAt = DateTime.UtcNow;
            order.CancelReason = request.Reason ?? "Refund requested by customer";
            order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Refund {RefundId} processed for order {OrderId}", refund.Id, order.OrderId);

            return Ok(new RefundResponse
            {
                Success = true,
                RefundId = refund.Id,
                Amount = refund.Amount,
                Status = refund.Status,
                Message = "Refund processed successfully"
            });
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error processing refund for order {OrderId}", order.OrderId);
            return StatusCode(500, $"Refund processing error: {ex.Message}");
        }
    }
}

// DTOs for Payment endpoints
public class PaymentConfigResponse
{
    public string? PublishableKey { get; set; }
}

public class CreatePaymentIntentRequest
{
    public Guid OrderId { get; set; }
}

public class PaymentIntentResponse
{
    public string? ClientSecret { get; set; }
    public string? PaymentIntentId { get; set; }
    public long Amount { get; set; }
    public string? Currency { get; set; }
}

public class ConfirmPaymentRequest
{
    public string PaymentIntentId { get; set; } = string.Empty;
}

public class PaymentConfirmationResponse
{
    public bool Success { get; set; }
    public Guid OrderId { get; set; }
    public string? OrderStatus { get; set; }
    public string? PaymentStatus { get; set; }
    public string? Message { get; set; }
}

public class RefundRequest
{
    public Guid OrderId { get; set; }
    public string? Reason { get; set; }
}

public class RefundResponse
{
    public bool Success { get; set; }
    public string? RefundId { get; set; }
    public long Amount { get; set; }
    public string? Status { get; set; }
    public string? Message { get; set; }
}
