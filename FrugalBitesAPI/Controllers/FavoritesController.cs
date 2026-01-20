using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FrugalBites.Data;
using FrugalBites.Models.Entities;
using System.Security.Claims;

namespace FrugalBites.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FavoritesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public FavoritesController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get user's favorite merchants
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<FavoriteMerchantResponse>>> GetFavorites()
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        var favorites = await _context.Favorites
            .Include(f => f.Merchant)
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new FavoriteMerchantResponse
            {
                FavoriteId = f.FavoriteId,
                MerchantId = f.MerchantId,
                BusinessName = f.Merchant.BusinessName,
                BusinessType = f.Merchant.BusinessType.ToString(),
                LogoUrl = f.Merchant.LogoUrl,
                City = f.Merchant.City,
                AverageRating = f.Merchant.AverageRating,
                TotalReviews = f.Merchant.TotalReviews,
                CreatedAt = f.CreatedAt
            })
            .ToListAsync();

        return Ok(favorites);
    }

    /// <summary>
    /// Add a merchant to favorites
    /// </summary>
    [HttpPost("{merchantId}")]
    public async Task<ActionResult<FavoriteMerchantResponse>> AddFavorite(Guid merchantId)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        // Check if merchant exists
        var merchant = await _context.Merchants.FindAsync(merchantId);
        if (merchant == null)
            return NotFound(new { message = "Merchant not found" });

        // Check if already favorited
        var existingFavorite = await _context.Favorites
            .FirstOrDefaultAsync(f => f.UserId == userId && f.MerchantId == merchantId);

        if (existingFavorite != null)
            return Ok(new FavoriteMerchantResponse
            {
                FavoriteId = existingFavorite.FavoriteId,
                MerchantId = merchant.MerchantId,
                BusinessName = merchant.BusinessName,
                BusinessType = merchant.BusinessType.ToString(),
                LogoUrl = merchant.LogoUrl,
                City = merchant.City,
                AverageRating = merchant.AverageRating,
                TotalReviews = merchant.TotalReviews,
                CreatedAt = existingFavorite.CreatedAt
            });

        var favorite = new Favorite
        {
            FavoriteId = Guid.NewGuid(),
            UserId = userId.Value,
            MerchantId = merchantId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Favorites.Add(favorite);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetFavorites), new FavoriteMerchantResponse
        {
            FavoriteId = favorite.FavoriteId,
            MerchantId = merchant.MerchantId,
            BusinessName = merchant.BusinessName,
            BusinessType = merchant.BusinessType.ToString(),
            LogoUrl = merchant.LogoUrl,
            City = merchant.City,
            AverageRating = merchant.AverageRating,
            TotalReviews = merchant.TotalReviews,
            CreatedAt = favorite.CreatedAt
        });
    }

    /// <summary>
    /// Remove a merchant from favorites
    /// </summary>
    [HttpDelete("{merchantId}")]
    public async Task<IActionResult> RemoveFavorite(Guid merchantId)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        var favorite = await _context.Favorites
            .FirstOrDefaultAsync(f => f.UserId == userId && f.MerchantId == merchantId);

        if (favorite == null)
            return NotFound(new { message = "Favorite not found" });

        _context.Favorites.Remove(favorite);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Check if a merchant is in user's favorites
    /// </summary>
    [HttpGet("check/{merchantId}")]
    public async Task<ActionResult<IsFavoriteResponse>> CheckFavorite(Guid merchantId)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        var isFavorite = await _context.Favorites
            .AnyAsync(f => f.UserId == userId && f.MerchantId == merchantId);

        return Ok(new IsFavoriteResponse { IsFavorite = isFavorite });
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return null;
        return userId;
    }
}

public class FavoriteMerchantResponse
{
    public Guid FavoriteId { get; set; }
    public Guid MerchantId { get; set; }
    public required string BusinessName { get; set; }
    public required string BusinessType { get; set; }
    public string? LogoUrl { get; set; }
    public string? City { get; set; }
    public decimal? AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class IsFavoriteResponse
{
    public bool IsFavorite { get; set; }
}
