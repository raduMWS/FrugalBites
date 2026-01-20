using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FrugalBites.Data;
using FrugalBites.Models.Entities;
using FrugalBites.Models.Enums;
using System.Security.Claims;

namespace FrugalBites.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ReviewsController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get reviews for a merchant
    /// </summary>
    [HttpGet("merchant/{merchantId}")]
    public async Task<ActionResult<IEnumerable<ReviewResponse>>> GetMerchantReviews(
        Guid merchantId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var reviews = await _context.Reviews
            .Include(r => r.User)
            .Where(r => r.MerchantId == merchantId)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new ReviewResponse
            {
                ReviewId = r.ReviewId,
                OrderId = r.OrderId,
                UserId = r.UserId,
                UserName = r.User.FirstName + " " + r.User.LastName.Substring(0, 1) + ".",
                MerchantId = r.MerchantId,
                Rating = r.Rating,
                ReviewText = r.ReviewText,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return Ok(reviews);
    }

    /// <summary>
    /// Get average rating for a merchant
    /// </summary>
    [HttpGet("merchant/{merchantId}/stats")]
    public async Task<ActionResult<ReviewStats>> GetMerchantReviewStats(Guid merchantId)
    {
        var reviews = await _context.Reviews
            .Where(r => r.MerchantId == merchantId)
            .ToListAsync();

        if (!reviews.Any())
        {
            return Ok(new ReviewStats
            {
                AverageRating = 0,
                TotalReviews = 0,
                RatingDistribution = new Dictionary<int, int>
                {
                    { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 }
                }
            });
        }

        var stats = new ReviewStats
        {
            AverageRating = reviews.Average(r => r.Rating),
            TotalReviews = reviews.Count,
            RatingDistribution = reviews
                .GroupBy(r => r.Rating)
                .ToDictionary(g => g.Key, g => g.Count())
        };

        // Ensure all ratings are represented
        for (int i = 1; i <= 5; i++)
        {
            if (!stats.RatingDistribution.ContainsKey(i))
                stats.RatingDistribution[i] = 0;
        }

        return Ok(stats);
    }

    /// <summary>
    /// Create a review for a completed order
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ReviewResponse>> CreateReview([FromBody] CreateReviewRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        // Verify the order exists and belongs to this user
        var order = await _context.Orders
            .Include(o => o.Offer)
            .FirstOrDefaultAsync(o => o.OrderId == request.OrderId && o.UserId == userId);

        if (order == null)
            return NotFound(new { message = "Order not found" });

        // Check if order is completed
        if (order.OrderStatus != OrderStatus.PICKED_UP)
            return BadRequest(new { message = "You can only review completed orders" });

        // Check if already reviewed
        var existingReview = await _context.Reviews
            .FirstOrDefaultAsync(r => r.OrderId == request.OrderId);

        if (existingReview != null)
            return BadRequest(new { message = "This order has already been reviewed" });

        // Create the review
        var review = new Review
        {
            ReviewId = Guid.NewGuid(),
            OrderId = order.OrderId,
            UserId = userId.Value,
            MerchantId = order.MerchantId,
            Rating = request.Rating,
            ReviewText = request.ReviewText,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Reviews.Add(review);

        // Update merchant average rating
        var merchant = await _context.Merchants.FindAsync(order.MerchantId);
        if (merchant != null)
        {
            var allReviews = await _context.Reviews
                .Where(r => r.MerchantId == merchant.MerchantId)
                .ToListAsync();

            var totalRating = allReviews.Sum(r => r.Rating) + review.Rating;
            var totalCount = allReviews.Count + 1;
            merchant.AverageRating = (decimal)totalRating / totalCount;
            merchant.TotalReviews = totalCount;
        }

        await _context.SaveChangesAsync();

        var user = await _context.Users.FindAsync(userId);

        return CreatedAtAction(nameof(GetReview), new { reviewId = review.ReviewId }, new ReviewResponse
        {
            ReviewId = review.ReviewId,
            OrderId = review.OrderId,
            UserId = review.UserId,
            UserName = user != null ? $"{user.FirstName} {user.LastName[0]}." : "Anonymous",
            MerchantId = review.MerchantId,
            Rating = review.Rating,
            ReviewText = review.ReviewText,
            CreatedAt = review.CreatedAt
        });
    }

    /// <summary>
    /// Get a specific review
    /// </summary>
    [HttpGet("{reviewId}")]
    public async Task<ActionResult<ReviewResponse>> GetReview(Guid reviewId)
    {
        var review = await _context.Reviews
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.ReviewId == reviewId);

        if (review == null)
            return NotFound();

        return Ok(new ReviewResponse
        {
            ReviewId = review.ReviewId,
            OrderId = review.OrderId,
            UserId = review.UserId,
            UserName = $"{review.User.FirstName} {review.User.LastName[0]}.",
            MerchantId = review.MerchantId,
            Rating = review.Rating,
            ReviewText = review.ReviewText,
            CreatedAt = review.CreatedAt
        });
    }

    /// <summary>
    /// Check if user can review an order
    /// </summary>
    [HttpGet("canReview/{orderId}")]
    [Authorize]
    public async Task<ActionResult<CanReviewResponse>> CanReviewOrder(Guid orderId)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == userId);

        if (order == null)
            return Ok(new CanReviewResponse { CanReview = false, Reason = "Order not found" });

        if (order.OrderStatus != OrderStatus.PICKED_UP)
            return Ok(new CanReviewResponse { CanReview = false, Reason = "Order not yet completed" });

        var existingReview = await _context.Reviews
            .FirstOrDefaultAsync(r => r.OrderId == orderId);

        if (existingReview != null)
            return Ok(new CanReviewResponse { CanReview = false, Reason = "Already reviewed" });

        return Ok(new CanReviewResponse { CanReview = true });
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return null;
        return userId;
    }
}

public class CreateReviewRequest
{
    public required Guid OrderId { get; set; }
    public required int Rating { get; set; } // 1-5
    public string? ReviewText { get; set; }
}

public class ReviewResponse
{
    public Guid ReviewId { get; set; }
    public Guid OrderId { get; set; }
    public Guid UserId { get; set; }
    public required string UserName { get; set; }
    public Guid MerchantId { get; set; }
    public int Rating { get; set; }
    public string? ReviewText { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ReviewStats
{
    public double AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public required Dictionary<int, int> RatingDistribution { get; set; }
}

public class CanReviewResponse
{
    public bool CanReview { get; set; }
    public string? Reason { get; set; }
}
