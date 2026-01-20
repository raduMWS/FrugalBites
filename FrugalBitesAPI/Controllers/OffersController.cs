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

    /// <summary>
    /// Search offers and merchants by query string
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<SearchResultDTO>> Search(
        [FromQuery] string q,
        [FromQuery] double? lat,
        [FromQuery] double? lng,
        [FromQuery] int limit = 20)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
        {
            return BadRequest("Search query must be at least 2 characters");
        }

        var searchTerm = q.ToLower().Trim();

        // Search offers
        var offers = await _context.Offers
            .Include(o => o.Merchant)
            .Where(o => o.IsAvailable && o.PickupEndTime > DateTime.UtcNow)
            .Where(o => 
                o.FoodName.ToLower().Contains(searchTerm) ||
                o.Description.ToLower().Contains(searchTerm) ||
                o.Merchant.BusinessName.ToLower().Contains(searchTerm))
            .Take(limit)
            .ToListAsync();

        // Search merchants
        var merchants = await _context.Merchants
            .Where(m => m.IsActive)
            .Where(m => 
                m.BusinessName.ToLower().Contains(searchTerm) ||
                (m.Description != null && m.Description.ToLower().Contains(searchTerm)) ||
                (m.AddressLine1 != null && m.AddressLine1.ToLower().Contains(searchTerm)) ||
                (m.City != null && m.City.ToLower().Contains(searchTerm)))
            .Take(limit)
            .ToListAsync();

        var result = new SearchResultDTO
        {
            Query = q,
            Offers = offers.Select(o => new OfferDTO
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
            }).ToList(),
            Merchants = merchants.Select(m => new MerchantDTO
            {
                MerchantId = m.MerchantId,
                UserId = m.UserId,
                BusinessName = m.BusinessName,
                BusinessType = m.BusinessType,
                Description = m.Description,
                AddressLine1 = m.AddressLine1,
                AddressLine2 = m.AddressLine2,
                City = m.City,
                PostalCode = m.PostalCode,
                CountryCode = m.CountryCode,
                Latitude = m.Latitude,
                Longitude = m.Longitude,
                PhoneNumber = m.PhoneNumber,
                LogoUrl = m.LogoUrl,
                CoverImageUrl = m.CoverImageUrl,
                AverageRating = m.AverageRating,
                TotalReviews = m.TotalReviews,
                IsActive = m.IsActive
            }).ToList(),
            TotalOffers = offers.Count,
            TotalMerchants = merchants.Count
        };

        return Ok(result);
    }

    /// <summary>
    /// Get search suggestions based on partial query
    /// </summary>
    [HttpGet("suggestions")]
    public async Task<ActionResult<IEnumerable<SearchSuggestionDTO>>> GetSuggestions([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
        {
            return Ok(Array.Empty<SearchSuggestionDTO>());
        }

        var searchTerm = q.ToLower().Trim();
        var suggestions = new List<SearchSuggestionDTO>();

        // Get offer suggestions
        var offerSuggestions = await _context.Offers
            .Where(o => o.IsAvailable && o.PickupEndTime > DateTime.UtcNow)
            .Where(o => o.FoodName.ToLower().Contains(searchTerm))
            .Select(o => new SearchSuggestionDTO
            {
                Id = o.OfferId.ToString(),
                Text = o.FoodName,
                Type = "offer",
                Icon = null
            })
            .Distinct()
            .Take(5)
            .ToListAsync();

        // Get merchant suggestions
        var merchantSuggestions = await _context.Merchants
            .Where(m => m.IsActive)
            .Where(m => m.BusinessName.ToLower().Contains(searchTerm))
            .Select(m => new SearchSuggestionDTO
            {
                Id = m.MerchantId.ToString(),
                Text = m.BusinessName,
                Type = "merchant",
                Icon = m.LogoUrl
            })
            .Take(5)
            .ToListAsync();

        suggestions.AddRange(offerSuggestions);
        suggestions.AddRange(merchantSuggestions);

        return Ok(suggestions.Take(10));
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

// DTOs for search
public class SearchResultDTO
{
    public string Query { get; set; } = string.Empty;
    public List<OfferDTO> Offers { get; set; } = new();
    public List<MerchantDTO> Merchants { get; set; } = new();
    public int TotalOffers { get; set; }
    public int TotalMerchants { get; set; }
}

public class SearchSuggestionDTO
{
    public string Id { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "offer", "merchant", "category"
    public string? Icon { get; set; }
}