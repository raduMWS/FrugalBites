using FrugalBites.Data;
using FrugalBites.Models.DTOs;
using FrugalBites.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FrugalBites.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MerchantsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public MerchantsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MerchantDTO>>> GetMerchants(
        [FromQuery] double? lat,
        [FromQuery] double? lng,
        [FromQuery] double radius = 10.0)
    {
        var merchants = await _context.Merchants
            .Where(m => m.IsActive)
            .ToListAsync();

        var merchantDTOs = merchants.Select(m => new MerchantDTO
        {
            MerchantId = m.MerchantId,
            BusinessName = m.BusinessName,
            Description = m.Description,
            LogoUrl = m.LogoUrl,
            CoverImageUrl = m.CoverImageUrl,
            Latitude = m.Latitude,
            Longitude = m.Longitude,
            City = m.City,
            AverageRating = m.AverageRating,
            TotalReviews = m.TotalReviews
        }).ToList();

        return Ok(merchantDTOs);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MerchantDTO>> GetMerchant(string id)
    {
        if (!Guid.TryParse(id, out var merchantGuid))
        {
            return BadRequest("Invalid merchant ID format");
        }

        var merchant = await _context.Merchants
            .FirstOrDefaultAsync(m => m.MerchantId == merchantGuid);

        if (merchant == null)
        {
            return NotFound();
        }

        var merchantDTO = new MerchantDTO
        {
            MerchantId = merchant.MerchantId,
            BusinessName = merchant.BusinessName,
            Description = merchant.Description,
            LogoUrl = merchant.LogoUrl,
            CoverImageUrl = merchant.CoverImageUrl,
            Latitude = merchant.Latitude,
            Longitude = merchant.Longitude,
            City = merchant.City,
            AverageRating = merchant.AverageRating,
            TotalReviews = merchant.TotalReviews
        };

        return Ok(merchantDTO);
    }

    // Haversine formula to calculate distance in kilometers
    private static double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371; // Radius of Earth in kilometers
        var dLat = DegreesToRadians(lat2 - lat1);
        var dLon = DegreesToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double DegreesToRadians(double degrees)
    {
        return degrees * Math.PI / 180;
    }
}
