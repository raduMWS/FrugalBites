using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FrugalBites.Data;
using FrugalBites.Models.Entities;
using FrugalBites.Models.Enums;
using System.Security.Claims;
using BCrypt.Net;

namespace FrugalBites.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public UserController(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    /// <summary>
    /// Get current user's profile
    /// </summary>
    [HttpGet("profile")]
    [Authorize]
    public async Task<ActionResult<UserProfileResponse>> GetProfile()
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return NotFound();

        // Get user stats
        var orders = await _context.Orders
            .Where(o => o.UserId == userId && o.OrderStatus == OrderStatus.PICKED_UP)
            .ToListAsync();

        var totalSaved = orders.Sum(o => o.DiscountAmount);
        var foodSavedKg = orders.Count * 0.35m; // Estimate 350g per order

        return Ok(new UserProfileResponse
        {
            UserId = user.UserId,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            PhoneNumber = user.PhoneNumber,
            ProfileImageUrl = user.ProfileImageUrl,
            IsEmailVerified = user.IsEmailVerified,
            IsPhoneVerified = user.IsPhoneVerified,
            CreatedAt = user.CreatedAt,
            Stats = new UserStats
            {
                TotalOrders = orders.Count,
                TotalSaved = totalSaved,
                FoodSavedKg = foodSavedKg
            }
        });
    }

    /// <summary>
    /// Update user's profile
    /// </summary>
    [HttpPut("profile")]
    [Authorize]
    public async Task<ActionResult<UserProfileResponse>> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return NotFound();

        // Update fields if provided
        if (!string.IsNullOrWhiteSpace(request.FirstName))
            user.FirstName = request.FirstName;

        if (!string.IsNullOrWhiteSpace(request.LastName))
            user.LastName = request.LastName;

        if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
            user.PhoneNumber = request.PhoneNumber;

        if (!string.IsNullOrWhiteSpace(request.ProfileImageUrl))
            user.ProfileImageUrl = request.ProfileImageUrl;

        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new UserProfileResponse
        {
            UserId = user.UserId,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            PhoneNumber = user.PhoneNumber,
            ProfileImageUrl = user.ProfileImageUrl,
            IsEmailVerified = user.IsEmailVerified,
            IsPhoneVerified = user.IsPhoneVerified,
            CreatedAt = user.CreatedAt
        });
    }

    /// <summary>
    /// Change user's password
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return NotFound();

        // Verify current password
        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "Current password is incorrect" });

        // Validate new password
        if (request.NewPassword.Length < 6)
            return BadRequest(new { message = "New password must be at least 6 characters" });

        // Update password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Password changed successfully" });
    }

    /// <summary>
    /// Request password reset (sends email with reset code)
    /// </summary>
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        
        // Always return success to prevent email enumeration
        if (user == null)
            return Ok(new { message = "If the email exists, a reset code has been sent" });

        // Generate a 6-digit reset code
        var resetCode = new Random().Next(100000, 999999).ToString();
        
        // Store the reset code (in production, use a separate table with expiry)
        // For MVP, we'll store in a simple way - in production use Redis or similar
        // Here we're using a simple approach with the user record
        
        // In a real app, you would:
        // 1. Store the reset code with expiry in a separate table/cache
        // 2. Send an email with the reset code
        // 3. The code should expire in 15-30 minutes
        
        // For MVP demo purposes, we'll log the code (in production, send via email)
        Console.WriteLine($"[PASSWORD RESET] Code for {user.Email}: {resetCode}");
        
        // Store the code temporarily (in production, use proper storage)
        PasswordResetCodes.Store(user.Email, resetCode);

        return Ok(new { message = "If the email exists, a reset code has been sent" });
    }

    /// <summary>
    /// Reset password with code
    /// </summary>
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        // Validate the reset code
        if (!PasswordResetCodes.Validate(request.Email, request.Code))
            return BadRequest(new { message = "Invalid or expired reset code" });

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null)
            return BadRequest(new { message = "Invalid or expired reset code" });

        // Validate new password
        if (request.NewPassword.Length < 6)
            return BadRequest(new { message = "Password must be at least 6 characters" });

        // Update password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Clear the used code
        PasswordResetCodes.Remove(request.Email);

        return Ok(new { message = "Password reset successfully" });
    }

    /// <summary>
    /// Delete user account
    /// </summary>
    [HttpDelete("account")]
    [Authorize]
    public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return NotFound();

        // Verify password
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return BadRequest(new { message = "Password is incorrect" });

        // Soft delete the user
        user.IsActive = false;
        user.DeletedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        
        // Anonymize personal data for GDPR compliance
        user.Email = $"deleted_{user.UserId}@deleted.local";
        user.FirstName = "Deleted";
        user.LastName = "User";
        user.PhoneNumber = null;
        user.ProfileImageUrl = null;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Account deleted successfully" });
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return null;
        return userId;
    }
}

// Simple in-memory password reset code storage (use Redis/database in production)
public static class PasswordResetCodes
{
    private static readonly Dictionary<string, (string Code, DateTime Expiry)> _codes = new();

    public static void Store(string email, string code)
    {
        _codes[email.ToLower()] = (code, DateTime.UtcNow.AddMinutes(30));
    }

    public static bool Validate(string email, string code)
    {
        if (_codes.TryGetValue(email.ToLower(), out var stored))
        {
            return stored.Code == code && stored.Expiry > DateTime.UtcNow;
        }
        return false;
    }

    public static void Remove(string email)
    {
        _codes.Remove(email.ToLower());
    }
}

public class UserProfileResponse
{
    public Guid UserId { get; set; }
    public required string Email { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? ProfileImageUrl { get; set; }
    public bool IsEmailVerified { get; set; }
    public bool IsPhoneVerified { get; set; }
    public DateTime CreatedAt { get; set; }
    public UserStats? Stats { get; set; }
}

public class UserStats
{
    public int TotalOrders { get; set; }
    public decimal TotalSaved { get; set; }
    public decimal FoodSavedKg { get; set; }
}

public class UpdateProfileRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? ProfileImageUrl { get; set; }
}

public class ChangePasswordRequest
{
    public required string CurrentPassword { get; set; }
    public required string NewPassword { get; set; }
}

// ForgotPasswordRequest and ResetPasswordRequest are defined in AuthController.cs

public class DeleteAccountRequest
{
    public required string Password { get; set; }
}
