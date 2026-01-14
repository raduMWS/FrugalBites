using FrugalBites.Data;
using FrugalBites.Models.DTOs;
using FrugalBites.Models.Entities;
using FrugalBites.Models.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FrugalBites.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OffersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public OffersController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("feed")]
    public async Task<ActionResult<IEnumerable<OfferDTO>>> GetOffersFeed(
        [FromQuery] double? lat,
        [FromQuery] double? lng,
        [FromQuery] double radius = 10.0,
        [FromQuery] OfferCategory? category = null,
        [FromQuery] DietaryType? dietary = null,
        [FromQuery] int? minDiscount = null)
    {
        var query = _context.Offers
            .Include(o => o.Merchant)
            .Where(o => o.IsAvailable && o.PickupEndTime > DateTime.UtcNow)
            .AsQueryable();

        // Filter by category if specified
        if (category.HasValue)
        {
            query = query.Where(o => o.Category == category.Value);
        }

        // Filter by dietary if specified
        if (dietary.HasValue && dietary.Value != DietaryType.NONE)
        {
            query = query.Where(o => o.Dietary == dietary.Value);
        }

        // Filter by minimum discount
        if (minDiscount.HasValue)
        {
            query = query.Where(o => o.DiscountPercentage >= minDiscount.Value);
        }

        var offers = await query
            .OrderByDescending(o => o.CreatedAt)
            .Take(50)
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
            MerchantName = o.Merchant.BusinessName,
            MerchantLogoUrl = o.Merchant.LogoUrl,
            MerchantRating = o.Merchant.AverageRating,
            DistanceKm = lat.HasValue && lng.HasValue && o.Merchant.Latitude.HasValue && o.Merchant.Longitude.HasValue
                ? CalculateDistance(lat.Value, lng.Value, (double)o.Merchant.Latitude.Value, (double)o.Merchant.Longitude.Value)
                : null
        }).ToList();

        // Sort by distance if location provided
        if (lat.HasValue && lng.HasValue)
        {
            offerDTOs = offerDTOs
                .Where(o => o.DistanceKm.HasValue)
                .OrderBy(o => o.DistanceKm)
                .ToList();
        }

        return Ok(offerDTOs);
    }

    [HttpGet("{offerId}")]
    public async Task<ActionResult<OfferDTO>> GetOffer(Guid offerId)
    {
        var offer = await _context.Offers
            .Include(o => o.Merchant)
            .FirstOrDefaultAsync(o => o.OfferId == offerId);

        if (offer == null)
        {
            return NotFound();
        }

        var offerDTO = new OfferDTO
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
            Dietary = offer.Dietary,
            ExpirationDate = offer.ExpirationDate,
            IsAvailable = offer.IsAvailable,
            CreatedAt = offer.CreatedAt,
            MerchantName = offer.Merchant.BusinessName,
            MerchantLogoUrl = offer.Merchant.LogoUrl,
            MerchantRating = offer.Merchant.AverageRating
        };

        return Ok(offerDTO);
    }

    private static double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371; // Earth's radius in kilometers

        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return R * c;
    }

    private static double ToRadians(double degrees)
    {
        return degrees * Math.PI / 180;
    }
}