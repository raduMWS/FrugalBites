using FrugalBites.Data;
using FrugalBites.Models.DTOs;
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
public class VendorController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public VendorController(ApplicationDbContext context)
    {
        _context = context;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }

    private async Task<Merchant?> GetCurrentMerchant()
    {
        var userId = GetCurrentUserId();
        return await _context.Merchants.FirstOrDefaultAsync(m => m.UserId == userId);
    }

    // GET: api/vendor/offers
    [HttpGet("offers")]
    public async Task<ActionResult<IEnumerable<OfferDTO>>> GetMyOffers()
    {
        var merchant = await GetCurrentMerchant();
        if (merchant == null)
        {
            return Forbid("User is not a merchant");
        }

        var offers = await _context.Offers
            .Where(o => o.MerchantId == merchant.MerchantId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var offerDTOs = offers.Select(o => new OfferDTO
        {
            OfferId = o.OfferId,
            MerchantId = o.MerchantId,
            FoodName = o.FoodName,
            Description = o.Description,
            Category = o.Category,
            OriginalPrice = o.OriginalPrice,
            DiscountedPrice = o.DiscountedPrice,
            DiscountPercentage = o.DiscountPercentage,
            Quantity = o.Quantity,
            QuantityUnit = o.QuantityUnit,
            ImageUrl = o.ImageUrl,
            PickupStartTime = o.PickupStartTime,
            PickupEndTime = o.PickupEndTime,
            Dietary = o.Dietary,
            ExpirationDate = o.ExpirationDate,
            IsAvailable = o.IsAvailable,
            CreatedAt = o.CreatedAt,
            MerchantName = merchant.BusinessName,
            MerchantLogoUrl = merchant.LogoUrl,
            MerchantRating = merchant.AverageRating
        }).ToList();

        return Ok(offerDTOs);
    }

    // POST: api/vendor/offers
    [HttpPost("offers")]
    public async Task<ActionResult<OfferDTO>> CreateOffer([FromBody] CreateOfferRequest request)
    {
        var merchant = await GetCurrentMerchant();
        if (merchant == null)
        {
            return Forbid("User is not a merchant");
        }

        // Calculate discount percentage
        var discountPercentage = (int)Math.Round((1 - (double)request.DiscountedPrice / (double)request.OriginalPrice) * 100);

        var offer = new Offer
        {
            OfferId = Guid.NewGuid(),
            MerchantId = merchant.MerchantId,
            FoodName = request.FoodName,
            Description = request.Description,
            Category = Enum.TryParse<OfferCategory>(request.Category, true, out var cat) ? cat : OfferCategory.PREPARED_MEALS,
            OriginalPrice = request.OriginalPrice,
            DiscountedPrice = request.DiscountedPrice,
            DiscountPercentage = discountPercentage,
            Quantity = request.Quantity,
            QuantityUnit = Enum.TryParse<QuantityUnit>(request.QuantityUnit, true, out var unit) ? unit : QuantityUnit.PIECE,
            ImageUrl = request.ImageUrl,
            PickupStartTime = request.PickupStartTime,
            PickupEndTime = request.PickupEndTime,
            Dietary = DietaryType.NONE,
            ExpirationDate = DateOnly.FromDateTime(request.PickupEndTime),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Offers.Add(offer);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMyOffers), new OfferDTO
        {
            OfferId = offer.OfferId,
            MerchantId = offer.MerchantId,
            FoodName = offer.FoodName,
            Description = offer.Description,
            Category = offer.Category,
            OriginalPrice = offer.OriginalPrice,
            DiscountedPrice = offer.DiscountedPrice,
            DiscountPercentage = offer.DiscountPercentage,
            Quantity = offer.Quantity,
            QuantityUnit = offer.QuantityUnit,
            ImageUrl = offer.ImageUrl,
            PickupStartTime = offer.PickupStartTime,
            PickupEndTime = offer.PickupEndTime,
            IsAvailable = offer.IsAvailable,
            CreatedAt = offer.CreatedAt,
            MerchantName = merchant.BusinessName,
            MerchantLogoUrl = merchant.LogoUrl,
            MerchantRating = merchant.AverageRating
        });
    }

    // PUT: api/vendor/offers/{offerId}
    [HttpPut("offers/{offerId}")]
    public async Task<ActionResult<OfferDTO>> UpdateOffer(Guid offerId, [FromBody] UpdateOfferRequest request)
    {
        var merchant = await GetCurrentMerchant();
        if (merchant == null)
        {
            return Forbid("User is not a merchant");
        }

        var offer = await _context.Offers.FirstOrDefaultAsync(o => o.OfferId == offerId && o.MerchantId == merchant.MerchantId);
        if (offer == null)
        {
            return NotFound("Offer not found");
        }

        if (request.FoodName != null) offer.FoodName = request.FoodName;
        if (request.Description != null) offer.Description = request.Description;
        if (request.OriginalPrice.HasValue) offer.OriginalPrice = request.OriginalPrice.Value;
        if (request.DiscountedPrice.HasValue) offer.DiscountedPrice = request.DiscountedPrice.Value;
        if (request.Quantity.HasValue) offer.Quantity = request.Quantity.Value;
        if (request.IsAvailable.HasValue) offer.IsAvailable = request.IsAvailable.Value;
        if (request.PickupStartTime.HasValue) offer.PickupStartTime = request.PickupStartTime.Value;
        if (request.PickupEndTime.HasValue) offer.PickupEndTime = request.PickupEndTime.Value;
        if (request.ImageUrl != null) offer.ImageUrl = request.ImageUrl;

        // Recalculate discount if prices changed
        if (request.OriginalPrice.HasValue || request.DiscountedPrice.HasValue)
        {
            offer.DiscountPercentage = (int)Math.Round((1 - (double)offer.DiscountedPrice / (double)offer.OriginalPrice) * 100);
        }

        offer.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new OfferDTO
        {
            OfferId = offer.OfferId,
            MerchantId = offer.MerchantId,
            FoodName = offer.FoodName,
            Description = offer.Description,
            Category = offer.Category,
            OriginalPrice = offer.OriginalPrice,
            DiscountedPrice = offer.DiscountedPrice,
            DiscountPercentage = offer.DiscountPercentage,
            Quantity = offer.Quantity,
            QuantityUnit = offer.QuantityUnit,
            ImageUrl = offer.ImageUrl,
            PickupStartTime = offer.PickupStartTime,
            PickupEndTime = offer.PickupEndTime,
            IsAvailable = offer.IsAvailable,
            CreatedAt = offer.CreatedAt,
            MerchantName = merchant.BusinessName,
            MerchantLogoUrl = merchant.LogoUrl,
            MerchantRating = merchant.AverageRating
        });
    }

    // PATCH: api/vendor/offers/{offerId}/toggle
    [HttpPatch("offers/{offerId}/toggle")]
    public async Task<ActionResult<OfferDTO>> ToggleOfferAvailability(Guid offerId)
    {
        var merchant = await GetCurrentMerchant();
        if (merchant == null)
        {
            return Forbid("User is not a merchant");
        }

        var offer = await _context.Offers.FirstOrDefaultAsync(o => o.OfferId == offerId && o.MerchantId == merchant.MerchantId);
        if (offer == null)
        {
            return NotFound("Offer not found");
        }

        offer.IsAvailable = !offer.IsAvailable;
        offer.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new OfferDTO
        {
            OfferId = offer.OfferId,
            MerchantId = offer.MerchantId,
            FoodName = offer.FoodName,
            Description = offer.Description,
            Category = offer.Category,
            OriginalPrice = offer.OriginalPrice,
            DiscountedPrice = offer.DiscountedPrice,
            DiscountPercentage = offer.DiscountPercentage,
            Quantity = offer.Quantity,
            QuantityUnit = offer.QuantityUnit,
            ImageUrl = offer.ImageUrl,
            PickupStartTime = offer.PickupStartTime,
            PickupEndTime = offer.PickupEndTime,
            IsAvailable = offer.IsAvailable,
            CreatedAt = offer.CreatedAt,
            MerchantName = merchant.BusinessName,
            MerchantLogoUrl = merchant.LogoUrl,
            MerchantRating = merchant.AverageRating
        });
    }

    // DELETE: api/vendor/offers/{offerId}
    [HttpDelete("offers/{offerId}")]
    public async Task<IActionResult> DeleteOffer(Guid offerId)
    {
        var merchant = await GetCurrentMerchant();
        if (merchant == null)
        {
            return Forbid("User is not a merchant");
        }

        var offer = await _context.Offers.FirstOrDefaultAsync(o => o.OfferId == offerId && o.MerchantId == merchant.MerchantId);
        if (offer == null)
        {
            return NotFound("Offer not found");
        }

        _context.Offers.Remove(offer);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // GET: api/vendor/orders
    [HttpGet("orders")]
    public async Task<ActionResult<IEnumerable<OrderDTO>>> GetMyOrders()
    {
        var merchant = await GetCurrentMerchant();
        if (merchant == null)
        {
            return Forbid("User is not a merchant");
        }

        var orders = await _context.Orders
            .Include(o => o.Offer)
            .Include(o => o.User)
            .Where(o => o.Offer.MerchantId == merchant.MerchantId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var orderDTOs = orders.Select(o => new OrderDTO
        {
            OrderId = o.OrderId,
            UserId = o.UserId,
            OfferId = o.OfferId,
            Quantity = o.Quantity,
            TotalPrice = o.TotalPrice,
            Status = o.OrderStatus.ToString(),
            PickupTime = o.PickupTime,
            CreatedAt = o.CreatedAt,
            CustomerName = $"{o.User.FirstName} {o.User.LastName}",
            OfferName = o.Offer.FoodName
        }).ToList();

        return Ok(orderDTOs);
    }

    // PATCH: api/vendor/orders/{orderId}/status
    [HttpPatch("orders/{orderId}/status")]
    public async Task<ActionResult<OrderDTO>> UpdateOrderStatus(Guid orderId, [FromBody] UpdateOrderStatusRequest request)
    {
        var merchant = await GetCurrentMerchant();
        if (merchant == null)
        {
            return Forbid("User is not a merchant");
        }

        var order = await _context.Orders
            .Include(o => o.Offer)
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.Offer.MerchantId == merchant.MerchantId);

        if (order == null)
        {
            return NotFound("Order not found");
        }

        if (!Enum.TryParse<OrderStatus>(request.Status, true, out var newStatus))
        {
            return BadRequest("Invalid status");
        }

        order.OrderStatus = newStatus;
        order.UpdatedAt = DateTime.UtcNow;

        if (newStatus == OrderStatus.PICKED_UP)
        {
            order.PickupConfirmedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Ok(new OrderDTO
        {
            OrderId = order.OrderId,
            UserId = order.UserId,
            OfferId = order.OfferId,
            Quantity = order.Quantity,
            TotalPrice = order.TotalPrice,
            Status = order.OrderStatus.ToString(),
            PickupTime = order.PickupTime,
            CreatedAt = order.CreatedAt,
            CustomerName = $"{order.User.FirstName} {order.User.LastName}",
            OfferName = order.Offer.FoodName
        });
    }

    // GET: api/vendor/analytics
    [HttpGet("analytics")]
    public async Task<ActionResult<VendorAnalyticsDTO>> GetAnalytics()
    {
        var merchant = await GetCurrentMerchant();
        if (merchant == null)
        {
            return Forbid("User is not a merchant");
        }

        var today = DateTime.UtcNow.Date;
        var orders = await _context.Orders
            .Include(o => o.Offer)
            .Where(o => o.Offer.MerchantId == merchant.MerchantId)
            .ToListAsync();

        var todayOrders = orders.Where(o => o.CreatedAt.Date == today).ToList();
        var completedOrders = orders.Where(o => o.OrderStatus == OrderStatus.PICKED_UP).ToList();

        return Ok(new VendorAnalyticsDTO
        {
            TodayOrders = todayOrders.Count,
            TodayRevenue = todayOrders.Sum(o => o.TotalPrice),
            TotalOrders = orders.Count,
            TotalRevenue = completedOrders.Sum(o => o.TotalPrice),
            TotalFoodSaved = completedOrders.Sum(o => o.Quantity),
            AverageRating = merchant.AverageRating
        });
    }
}

// DTOs for requests
public class CreateOfferRequest
{
    public string FoodName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = "PREPARED_MEALS";
    public decimal OriginalPrice { get; set; }
    public decimal DiscountedPrice { get; set; }
    public int Quantity { get; set; }
    public string QuantityUnit { get; set; } = "PIECE";
    public string? ImageUrl { get; set; }
    public DateTime PickupStartTime { get; set; }
    public DateTime PickupEndTime { get; set; }
}

public class UpdateOfferRequest
{
    public string? FoodName { get; set; }
    public string? Description { get; set; }
    public decimal? OriginalPrice { get; set; }
    public decimal? DiscountedPrice { get; set; }
    public int? Quantity { get; set; }
    public bool? IsAvailable { get; set; }
    public DateTime? PickupStartTime { get; set; }
    public DateTime? PickupEndTime { get; set; }
    public string? ImageUrl { get; set; }
}

// UpdateOrderStatusRequest is defined in OrdersController.cs

public class VendorAnalyticsDTO
{
    public int TodayOrders { get; set; }
    public decimal TodayRevenue { get; set; }
    public int TotalOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public int TotalFoodSaved { get; set; }
    public decimal AverageRating { get; set; }
}

public class OrderDTO
{
    public Guid OrderId { get; set; }
    public Guid UserId { get; set; }
    public Guid OfferId { get; set; }
    public int Quantity { get; set; }
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? PickupTime { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CustomerName { get; set; }
    public string? OfferName { get; set; }
}
