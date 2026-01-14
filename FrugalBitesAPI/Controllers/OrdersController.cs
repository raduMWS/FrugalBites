using FrugalBites.Data;
using FrugalBites.Models.Entities;
using FrugalBites.Models.Enums;
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

    public OrdersController(ApplicationDbContext context, ILogger<OrdersController> logger)
    {
        _context = context;
        _logger = logger;
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
            CreatedAt = o.CreatedAt
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
            CreatedAt = order.CreatedAt
        };

        return Ok(orderDTO);
    }

    // POST: api/orders
    // Create a new order
    [HttpPost]
    public async Task<ActionResult<OrderResponseDTO>> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var userId = GetCurrentUserId();

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
            CreatedAt = order.CreatedAt
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
    public DateTime? PickupConfirmedAt { get; set; }
    public string? CustomerNotes { get; set; }
    public DateTime CreatedAt { get; set; }
}
