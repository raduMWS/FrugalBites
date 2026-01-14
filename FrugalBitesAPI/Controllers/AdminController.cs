using FrugalBites.Data;
using FrugalBites.Models.DTOs;
using FrugalBites.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FrugalBites.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("offers")]
    public async Task<ActionResult<IEnumerable<OfferDTO>>> GetAllOffers()
    {
        var offers = await _context.Offers
            .Include(o => o.Merchant)
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
            MerchantRating = o.Merchant.AverageRating
        }).ToList();

        return Ok(offerDTOs);
    }

    [HttpPut("offers/{offerId}")]
    public async Task<IActionResult> UpdateOffer(Guid offerId, [FromBody] OfferUpdateDTO updateDTO)
    {
        var offer = await _context.Offers.FindAsync(offerId);
        if (offer == null)
        {
            return NotFound();
        }

        if (updateDTO.FoodName != null) offer.FoodName = updateDTO.FoodName;
        if (updateDTO.Description != null) offer.Description = updateDTO.Description;
        // Add other fields as needed

        offer.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("merchants")]
    public async Task<ActionResult<IEnumerable<MerchantDTO>>> GetAllMerchants()
    {
        var merchants = await _context.Merchants
            .Include(m => m.User)
            .ToListAsync();

        var merchantDTOs = merchants.Select(m => new MerchantDTO
        {
            MerchantId = m.MerchantId,
            UserId = m.UserId,
            BusinessName = m.BusinessName,
            BusinessType = m.BusinessType,
            Description = m.Description,
            LogoUrl = m.LogoUrl,
            CoverImageUrl = m.CoverImageUrl,
            Latitude = m.Latitude,
            Longitude = m.Longitude,
            AddressLine1 = m.AddressLine1,
            AddressLine2 = m.AddressLine2,
            City = m.City,
            PostalCode = m.PostalCode,
            CountryCode = m.CountryCode,
            PhoneNumber = m.PhoneNumber,
            WebsiteUrl = m.WebsiteUrl,
            OperatingHoursJson = m.OperatingHoursJson,
            PickupInstructions = m.PickupInstructions,
            AverageRating = m.AverageRating,
            TotalReviews = m.TotalReviews,
            IsVerified = m.IsVerified,
            StripeAccountId = m.StripeAccountId,
            CommissionRate = m.CommissionRate,
            CreatedAt = m.CreatedAt,
            UpdatedAt = m.UpdatedAt,
            IsActive = m.IsActive
        }).ToList();

        return Ok(merchantDTOs);
    }

    [HttpPut("merchants/{merchantId}")]
    public async Task<IActionResult> UpdateMerchant(Guid merchantId, [FromBody] MerchantUpdateDTO updateDTO)
    {
        var merchant = await _context.Merchants.FindAsync(merchantId);
        if (merchant == null)
        {
            return NotFound();
        }

        if (updateDTO.BusinessName != null) merchant.BusinessName = updateDTO.BusinessName;
        if (updateDTO.Description != null) merchant.Description = updateDTO.Description;
        // Add other fields as needed

        merchant.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }
}

// DTOs for updates
public class OfferUpdateDTO
{
    public string? FoodName { get; set; }
    public string? Description { get; set; }
    // Add other updatable fields
}

public class MerchantUpdateDTO
{
    public string? BusinessName { get; set; }
    public string? Description { get; set; }
    // Add other updatable fields
}