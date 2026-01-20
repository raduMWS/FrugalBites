using FrugalBites.Data;
using FrugalBites.Models.Entities;
using FrugalBites.Models.Enums;
using FrugalBites.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FrugalBites.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<OrdersController> _logger;
    private readonly IQRCodeService _qrCodeService;
    private readonly IEmailService _emailService;
    private readonly IPushNotificationService _pushNotificationService;

    public OrdersController(
        ApplicationDbContext context, 
        ILogger<OrdersController> logger,
        IQRCodeService qrCodeService,
        IEmailService emailService,
        IPushNotificationService pushNotificationService)
    {
        _context = context;
        _logger = logger;
        _qrCodeService = qrCodeService;
        _emailService = emailService;
        _pushNotificationService = pushNotificationService;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }

    // GET: api/orders
    // Get current user's orders
    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrderResponseDTO>>> GetMyOrders()
    {
        var userId = GetCurrentUserId();

        var orders = await _context.Orders
            .Include(o => o.Offer)
            .Include(o => o.Merchant)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var orderDTOs = orders.Select(o => new OrderResponseDTO
        {
            OrderId = o.OrderId,
            OfferId = o.OfferId,
            MerchantId = o.MerchantId,
            FoodName = o.Offer.FoodName,
            MerchantName = o.Merchant.BusinessName,
            MerchantAddress = $"{o.Merchant.AddressLine1}, {o.Merchant.City}",
            ImageUrl = o.Offer.ImageUrl,
            Quantity = o.Quantity,
            TotalPrice = o.TotalPrice,
            DiscountAmount = o.DiscountAmount,
            OrderStatus = o.OrderStatus.ToString(),
            PaymentStatus = o.PaymentStatus.ToString(),
            PickupTime = o.PickupTime,
            PickupConfirmedAt = o.PickupConfirmedAt,
            CustomerNotes = o.CustomerNotes,
            CreatedAt = o.CreatedAt,
               PickupStartTime = o.PickupStartTime,
               PickupEndTime = o.PickupEndTime,
            QRCode = o.PaymentStatus == PaymentStatus.COMPLETED && o.OrderStatus != OrderStatus.PICKED_UP 
                ? _qrCodeService.GenerateOrderQRCode(o.OrderId, userId) 
                : null
        }).ToList();

        _logger.LogInformation("User {UserId} retrieved {Count} orders", userId, orderDTOs.Count);

        return Ok(orderDTOs);
    }

    // GET: api/orders/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<OrderResponseDTO>> GetOrder(Guid id)
    {
        var userId = GetCurrentUserId();

        var order = await _context.Orders
            .Include(o => o.Offer)
            .Include(o => o.Merchant)
            .FirstOrDefaultAsync(o => o.OrderId == id && o.UserId == userId);

        if (order == null)
        {
            return NotFound("Order not found");
        }

        var orderDTO = new OrderResponseDTO
        {
            OrderId = order.OrderId,
            OfferId = order.OfferId,
            MerchantId = order.MerchantId,
            FoodName = order.Offer.FoodName,
            MerchantName = order.Merchant.BusinessName,
            MerchantAddress = $"{order.Merchant.AddressLine1}, {order.Merchant.City}",
            ImageUrl = order.Offer.ImageUrl,
            Quantity = order.Quantity,
            TotalPrice = order.TotalPrice,
            DiscountAmount = order.DiscountAmount,
            OrderStatus = order.OrderStatus.ToString(),
            PaymentStatus = order.PaymentStatus.ToString(),
            PickupTime = order.PickupTime,
            PickupConfirmedAt = order.PickupConfirmedAt,
            CustomerNotes = order.CustomerNotes,
            CreatedAt = order.CreatedAt,
               PickupStartTime = order.PickupStartTime,
               PickupEndTime = order.PickupEndTime,
            QRCode = order.PaymentStatus == PaymentStatus.COMPLETED && order.OrderStatus != OrderStatus.PICKED_UP 
                ? _qrCodeService.GenerateOrderQRCode(order.OrderId, userId) 
                : null
        };

        return Ok(orderDTO);
    }

    // GET: api/orders/{id}/qrcode
    [HttpGet("{id}/qrcode")]
    public async Task<ActionResult<QRCodeResponse>> GetOrderQRCode(Guid id)
    {
        var userId = GetCurrentUserId();

        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.OrderId == id && o.UserId == userId);

        if (order == null)
        {
            return NotFound("Order not found");
        }

        if (order.PaymentStatus != PaymentStatus.COMPLETED)
        {
            return BadRequest("Order must be paid before generating QR code");
        }

        if (order.OrderStatus == OrderStatus.PICKED_UP)
        {
            return BadRequest("Order has already been picked up");
        }

        var qrCode = _qrCodeService.GenerateOrderQRCode(order.OrderId, userId);
        
        return Ok(new QRCodeResponse { QRCode = qrCode, OrderId = order.OrderId.ToString() });
    }

    // POST: api/orders
    // Create a new order
    [HttpPost]
    public async Task<ActionResult<OrderResponseDTO>> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var userId = GetCurrentUserId();

        // Verify user exists in database
        var userExists = await _context.Users.AnyAsync(u => u.UserId == userId);
        if (!userExists)
        {
            _logger.LogWarning("Order creation failed: User {UserId} not found in database. User may need to re-login.", userId);
            return Unauthorized(new { message = "User session expired. Please log out and log in again." });
        }

        _logger.LogInformation("User {UserId} creating order for offer {OfferId}", userId, request.OfferId);

        // Get the offer
        var offer = await _context.Offers
            .Include(o => o.Merchant)
            .FirstOrDefaultAsync(o => o.OfferId == request.OfferId);

        if (offer == null)
        {
            _logger.LogWarning("Order creation failed: Offer {OfferId} not found", request.OfferId);
            return NotFound("Offer not found");
        }

        if (!offer.IsAvailable)
        {
            _logger.LogWarning("Order creation failed: Offer {OfferId} is not available", request.OfferId);
            return BadRequest("This offer is no longer available");
        }

        if (offer.Quantity < request.Quantity)
        {
            _logger.LogWarning("Order creation failed: Insufficient quantity. Requested {Requested}, Available {Available}", 
                request.Quantity, offer.Quantity);
            return BadRequest($"Only {offer.Quantity} items available");
        }

        // Calculate totals
        var totalPrice = offer.DiscountedPrice * request.Quantity;
        var discountAmount = (offer.OriginalPrice - offer.DiscountedPrice) * request.Quantity;

        // Create the order
        var order = new Order
        {
            OrderId = Guid.NewGuid(),
            UserId = userId,
            MerchantId = offer.MerchantId,
            OfferId = offer.OfferId,
            Quantity = request.Quantity,
            TotalPrice = totalPrice,
            DiscountAmount = discountAmount,
            OrderStatus = OrderStatus.PENDING,
            PaymentStatus = PaymentStatus.PENDING,
            PickupTime = request.PickupTime,
            PickupStartTime = offer.PickupStartTime,
            PickupEndTime = offer.PickupEndTime,
            CustomerNotes = request.CustomerNotes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Reduce offer quantity
        offer.Quantity -= request.Quantity;
        if (offer.Quantity == 0)
        {
            offer.IsAvailable = false;
        }
        offer.UpdatedAt = DateTime.UtcNow;

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Order {OrderId} created successfully for user {UserId}", order.OrderId, userId);

        var orderDTO = new OrderResponseDTO
        {
            OrderId = order.OrderId,
            OfferId = order.OfferId,
            MerchantId = order.MerchantId,
            FoodName = offer.FoodName,
            MerchantName = offer.Merchant.BusinessName,
            MerchantAddress = $"{offer.Merchant.AddressLine1}, {offer.Merchant.City}",
            ImageUrl = offer.ImageUrl,
            Quantity = order.Quantity,
            TotalPrice = order.TotalPrice,
            DiscountAmount = order.DiscountAmount,
            OrderStatus = order.OrderStatus.ToString(),
            PaymentStatus = order.PaymentStatus.ToString(),
            PickupTime = order.PickupTime,
            CustomerNotes = order.CustomerNotes,
            CreatedAt = order.CreatedAt,
            PickupStartTime = order.PickupStartTime,
            PickupEndTime = order.PickupEndTime,
        };

        return CreatedAtAction(nameof(GetOrder), new { id = order.OrderId }, orderDTO);
    }

    // POST: api/orders/{id}/cancel
    // Cancel an order
    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<OrderResponseDTO>> CancelOrder(Guid id, [FromBody] CancelOrderRequest? request)
    {
        var userId = GetCurrentUserId();

        var order = await _context.Orders
            .Include(o => o.Offer)
            .Include(o => o.Merchant)
            .FirstOrDefaultAsync(o => o.OrderId == id && o.UserId == userId);

        if (order == null)
        {
            return NotFound("Order not found");
        }

        // Only pending or confirmed orders can be cancelled
        if (order.OrderStatus != OrderStatus.PENDING && order.OrderStatus != OrderStatus.CONFIRMED)
        {
            return BadRequest("This order cannot be cancelled");
        }

        // Restore offer quantity
        order.Offer.Quantity += order.Quantity;
        if (!order.Offer.IsAvailable && order.Offer.Quantity > 0)
        {
            order.Offer.IsAvailable = true;
        }

        order.OrderStatus = OrderStatus.CANCELLED;
        order.CancelledAt = DateTime.UtcNow;
        order.CancelReason = request?.Reason ?? "Cancelled by customer";
        order.UpdatedAt = DateTime.UtcNow;

        // TODO: Process refund if payment was made
        if (order.PaymentStatus == PaymentStatus.COMPLETED)
        {
            // Stripe refund logic will go here
            order.PaymentStatus = PaymentStatus.REFUNDED;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Order {OrderId} cancelled by user {UserId}", id, userId);

        var orderDTO = new OrderResponseDTO
        {
            OrderId = order.OrderId,
            OfferId = order.OfferId,
            MerchantId = order.MerchantId,
            FoodName = order.Offer.FoodName,
            MerchantName = order.Merchant.BusinessName,
            MerchantAddress = $"{order.Merchant.AddressLine1}, {order.Merchant.City}",
            ImageUrl = order.Offer.ImageUrl,
            Quantity = order.Quantity,
            TotalPrice = order.TotalPrice,
            DiscountAmount = order.DiscountAmount,
            OrderStatus = order.OrderStatus.ToString(),
            PaymentStatus = order.PaymentStatus.ToString(),
            PickupTime = order.PickupTime,
            CustomerNotes = order.CustomerNotes,
            CreatedAt = order.CreatedAt
        };

        return Ok(orderDTO);
    }

    // POST: api/orders/verify-pickup
    // Vendor verifies and confirms order pickup via QR code
    [HttpPost("verify-pickup")]
    public async Task<ActionResult<VerifyPickupResponse>> VerifyPickup([FromBody] VerifyPickupRequest request)
    {
        var merchantUserId = GetCurrentUserId();

        // Verify the QR code is valid
        var (isValid, orderId, userId) = _qrCodeService.ValidateOrderQRCode(request.QRCode);
        
        if (!isValid || orderId == null || userId == null)
        {
            _logger.LogWarning("Invalid or expired QR code presented");
            return BadRequest(new { message = "Invalid or expired QR code" });
        }

        var order = await _context.Orders
            .Include(o => o.Offer)
            .Include(o => o.Merchant)
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.OrderId == orderId.Value);

        if (order == null)
        {
            return NotFound(new { message = "Order not found" });
        }

        // Verify the merchant user has access to this merchant
        var merchant = await _context.Merchants
            .FirstOrDefaultAsync(m => m.MerchantId == order.MerchantId && m.UserId == merchantUserId);

        if (merchant == null)
        {
            _logger.LogWarning("User {UserId} tried to verify order for merchant they don't own", merchantUserId);
            return Forbid();
        }

        if (order.OrderStatus == OrderStatus.PICKED_UP)
        {
            return BadRequest(new { message = "Order has already been picked up" });
        }

        if (order.PaymentStatus != PaymentStatus.COMPLETED)
        {
            return BadRequest(new { message = "Order payment is not completed" });
        }

        var response = new VerifyPickupResponse
        {
            OrderId = order.OrderId,
            OrderNumber = order.OrderId.ToString().Substring(0, 8).ToUpper(),
            CustomerName = $"{order.User.FirstName} {order.User.LastName}",
            Items = new List<string> { $"{order.Quantity}x {order.Offer.FoodName}" },
            Total = order.TotalPrice,
            PickupTime = order.PickupTime,
            PickupStartTime = order.PickupStartTime,
            PickupEndTime = order.PickupEndTime,
            IsValid = true,
        };

        return Ok(response);
    }

    // PATCH: api/orders/{id}/status
    // Update order status (for vendors)
    [HttpPatch("{id}/status")]
    public async Task<ActionResult<OrderResponseDTO>> UpdateOrderStatus(Guid id, [FromBody] UpdateOrderStatusRequest request)
    {
        var merchantUserId = GetCurrentUserId();

        var order = await _context.Orders
            .Include(o => o.Offer)
            .Include(o => o.Merchant)
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.OrderId == id);

        if (order == null)
        {
            return NotFound("Order not found");
        }

        // Verify the merchant user has access
        var merchant = await _context.Merchants
            .FirstOrDefaultAsync(m => m.MerchantId == order.MerchantId && m.UserId == merchantUserId);

        if (merchant == null)
        {
            return Forbid();
        }

        // Parse and validate new status
        if (!Enum.TryParse<OrderStatus>(request.Status, true, out var newStatus))
        {
            return BadRequest("Invalid status");
        }

        var oldStatus = order.OrderStatus;
        order.OrderStatus = newStatus;
        order.UpdatedAt = DateTime.UtcNow;

        if (newStatus == OrderStatus.PICKED_UP)
        {
            order.PickupConfirmedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Send notifications
        try
        {
            // Send email notification
            if (newStatus == OrderStatus.CONFIRMED)
            {
                await _emailService.SendOrderConfirmationAsync(
                    order.User.Email,
                    order.User.FirstName,
                    order.OrderId.ToString().Substring(0, 8).ToUpper(),
                    order.Offer.FoodName,
                    order.TotalPrice,
                    order.PickupTime ?? DateTime.UtcNow.AddHours(1));
            }
            else if (newStatus == OrderStatus.READY)
            {
                await _emailService.SendOrderReadyAsync(
                    order.User.Email,
                    order.User.FirstName,
                    order.OrderId.ToString().Substring(0, 8).ToUpper(),
                    order.Merchant.BusinessName);
            }

            // Send push notification
            await _pushNotificationService.SendOrderStatusUpdateAsync(
                order.UserId.ToString(),
                order.OrderId.ToString(),
                newStatus.ToString(),
                order.Merchant.BusinessName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send notification for order {OrderId}", id);
            // Don't fail the request if notification fails
        }

        _logger.LogInformation("Order {OrderId} status updated from {OldStatus} to {NewStatus}", id, oldStatus, newStatus);

        var orderDTO = new OrderResponseDTO
        {
            OrderId = order.OrderId,
            OfferId = order.OfferId,
            MerchantId = order.MerchantId,
            FoodName = order.Offer.FoodName,
            MerchantName = order.Merchant.BusinessName,
            MerchantAddress = $"{order.Merchant.AddressLine1}, {order.Merchant.City}",
            ImageUrl = order.Offer.ImageUrl,
            Quantity = order.Quantity,
            TotalPrice = order.TotalPrice,
            DiscountAmount = order.DiscountAmount,
            OrderStatus = order.OrderStatus.ToString(),
            PaymentStatus = order.PaymentStatus.ToString(),
            PickupTime = order.PickupTime,
            PickupConfirmedAt = order.PickupConfirmedAt,
            CustomerNotes = order.CustomerNotes,
            CreatedAt = order.CreatedAt
        };

        return Ok(orderDTO);
    }
}

// DTOs
public class CreateOrderRequest
{
    public Guid OfferId { get; set; }
    public int Quantity { get; set; } = 1;
    public DateTime? PickupTime { get; set; }
    public string? CustomerNotes { get; set; }
}

public class CancelOrderRequest
{
    public string? Reason { get; set; }
}

public class VerifyPickupRequest
{
    public required string QRCode { get; set; }
}

public class VerifyPickupResponse
{
    public Guid OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public List<string> Items { get; set; } = new();
    public decimal Total { get; set; }
    public DateTime? PickupTime { get; set; }
    public DateTime? PickupStartTime { get; set; }
    public DateTime? PickupEndTime { get; set; }
    public bool IsValid { get; set; }
}

public class UpdateOrderStatusRequest
{
    public required string Status { get; set; }
}

public class OrderResponseDTO
{
    public Guid OrderId { get; set; }
    public Guid OfferId { get; set; }
    public Guid MerchantId { get; set; }
    public string FoodName { get; set; } = string.Empty;
    public string MerchantName { get; set; } = string.Empty;
    public string MerchantAddress { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int Quantity { get; set; }
    public decimal TotalPrice { get; set; }
    public decimal DiscountAmount { get; set; }
    public string OrderStatus { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public DateTime? PickupTime { get; set; }
    public DateTime? PickupStartTime { get; set; }
    public DateTime? PickupEndTime { get; set; }
    public DateTime? PickupConfirmedAt { get; set; }
    public string? CustomerNotes { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? QRCode { get; set; }
}

public class QRCodeResponse
{
    public required string QRCode { get; set; }
    public required string OrderId { get; set; }
}
