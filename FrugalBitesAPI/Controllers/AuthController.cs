using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using FrugalBites.Models.Entities;
using FrugalBites.Data;
using FrugalBites.Models.Enums;
using FrugalBites.Services;

namespace FrugalBites.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthController> _logger;
    
    // In-memory store for verification codes (use Redis in production)
    private static readonly Dictionary<string, (string Code, DateTime Expiry, string Type)> _verificationCodes = new();

    public AuthController(
        ApplicationDbContext context, 
        IConfiguration configuration,
        IEmailService emailService,
        ILogger<AuthController> logger)
    {
        _context = context;
        _configuration = configuration;
        _emailService = emailService;
        _logger = logger;
    }

    [HttpPost("signup")]
    public async Task<ActionResult<AuthResponse>> Signup([FromBody] SignUpRequest request)
    {
        // Validate input
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email and password are required" });
        }

        // Validate email format
        if (!IsValidEmail(request.Email))
        {
            return BadRequest(new { message = "Invalid email format" });
        }

        // Validate password strength
        if (request.Password.Length < 8)
        {
            return BadRequest(new { message = "Password must be at least 8 characters long" });
        }

        // Check if user already exists
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (existingUser != null)
        {
            return BadRequest(new { message = "User with this email already exists" });
        }

        // Hash password
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

        // Create new user
        var user = new User
        {
            UserId = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = hashedPassword,
            FirstName = request.FirstName,
            LastName = request.LastName,
            UserType = UserType.CONSUMER,
            IsEmailVerified = false,
            IsPhoneVerified = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Send verification email
        try
        {
            var verificationCode = GenerateVerificationCode();
            _verificationCodes[request.Email] = (verificationCode, DateTime.UtcNow.AddMinutes(15), "email_verification");
            await _emailService.SendEmailVerificationAsync(request.Email, request.FirstName, verificationCode);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send verification email to {Email}", request.Email);
        }

        // Generate JWT token
        var token = GenerateJwtToken(user);

        return Ok(new AuthResponse
        {
            Token = token,
            User = new UserDto
            {
                UserId = user.UserId.ToString(),
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                UserType = user.UserType.ToString(),
                SubscriptionStatus = request.SubscriptionStatus,
                IsEmailVerified = user.IsEmailVerified,
                CreatedAt = user.CreatedAt
            }
        });
    }

    [HttpPost("verify-email")]
    [Authorize]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(Guid.Parse(userIdClaim));
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        if (user.IsEmailVerified)
        {
            return Ok(new { message = "Email already verified" });
        }

        if (!_verificationCodes.TryGetValue(user.Email, out var stored) || 
            stored.Type != "email_verification" ||
            stored.Expiry < DateTime.UtcNow ||
            stored.Code != request.Code)
        {
            return BadRequest(new { message = "Invalid or expired verification code" });
        }

        user.IsEmailVerified = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _verificationCodes.Remove(user.Email);
        _logger.LogInformation("Email verified for user {UserId}", user.UserId);

        return Ok(new { message = "Email verified successfully" });
    }

    [HttpPost("resend-verification")]
    [Authorize]
    public async Task<IActionResult> ResendVerification()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(Guid.Parse(userIdClaim));
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        if (user.IsEmailVerified)
        {
            return Ok(new { message = "Email already verified" });
        }

        var verificationCode = GenerateVerificationCode();
        _verificationCodes[user.Email] = (verificationCode, DateTime.UtcNow.AddMinutes(15), "email_verification");
        
        await _emailService.SendEmailVerificationAsync(user.Email, user.FirstName, verificationCode);
        
        return Ok(new { message = "Verification email sent" });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        
        // Always return success to prevent email enumeration
        if (user == null)
        {
            return Ok(new { message = "If an account exists with this email, a password reset code has been sent." });
        }

        var resetCode = GenerateVerificationCode();
        _verificationCodes[request.Email] = (resetCode, DateTime.UtcNow.AddMinutes(15), "password_reset");
        
        await _emailService.SendPasswordResetAsync(user.Email, user.FirstName, resetCode);
        _logger.LogInformation("Password reset requested for {Email}", request.Email);

        return Ok(new { message = "If an account exists with this email, a password reset code has been sent." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 8)
        {
            return BadRequest(new { message = "Password must be at least 8 characters long" });
        }

        if (!_verificationCodes.TryGetValue(request.Email, out var stored) || 
            stored.Type != "password_reset" ||
            stored.Expiry < DateTime.UtcNow ||
            stored.Code != request.Code)
        {
            return BadRequest(new { message = "Invalid or expired reset code" });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null)
        {
            return BadRequest(new { message = "Invalid or expired reset code" });
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _verificationCodes.Remove(request.Email);
        _logger.LogInformation("Password reset completed for {Email}", request.Email);

        return Ok(new { message = "Password has been reset successfully" });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        // Validate input
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email and password are required" });
        }

        // Find user
        var user = _context.Users.FirstOrDefault(u => u.Email == request.Email);
        if (user == null)
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        // Verify password
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        // Generate JWT token
        var token = GenerateJwtToken(user);

        return Ok(new AuthResponse
        {
            Token = token,
            User = new UserDto
            {
                UserId = user.UserId.ToString(),
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                UserType = user.UserType.ToString(),
                SubscriptionStatus = "FREE", // TODO: Get from database if adding subscription table
                IsEmailVerified = user.IsEmailVerified,
                CreatedAt = user.CreatedAt
            }
        });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok(new { message = "Logged out successfully" });
    }

    [HttpPost("social-login")]
    public async Task<ActionResult<AuthResponse>> SocialLogin([FromBody] SocialLoginRequest request)
    {
        if (string.IsNullOrEmpty(request.Email))
        {
            return BadRequest(new { message = "Email is required for social login" });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        
        if (user == null)
        {
            user = new User
            {
                UserId = Guid.NewGuid(),
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
                FirstName = request.FirstName ?? "User",
                LastName = request.LastName ?? "",
                UserType = UserType.CONSUMER,
                IsEmailVerified = true,
                IsPhoneVerified = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            _logger.LogInformation("New user created via {Provider} social login: {Email}", request.Provider, request.Email);
        }

        var token = GenerateJwtToken(user);

        return Ok(new AuthResponse
        {
            Token = token,
            User = new UserDto
            {
                UserId = user.UserId.ToString(),
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                UserType = user.UserType.ToString(),
                SubscriptionStatus = "FREE",
                IsEmailVerified = user.IsEmailVerified,
                CreatedAt = user.CreatedAt
            }
        });
    }

    [HttpPost("register-device")]
    [Authorize]
    public IActionResult RegisterDevice([FromBody] RegisterDeviceRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim))
        {
            return Unauthorized();
        }

        _logger.LogInformation("Device registered for user {UserId}: {Platform}", userIdClaim, request.Platform);
        return Ok(new { message = "Device registered successfully" });
    }

    private string GenerateVerificationCode()
    {
        return new Random().Next(100000, 999999).ToString();
    }

    private bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }

    private string GenerateJwtToken(User user)
    {
        var jwtSecret = _configuration["JwtSettings:Secret"];
        if (string.IsNullOrEmpty(jwtSecret))
        {
            throw new InvalidOperationException("JWT secret is not configured");
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.GivenName, user.FirstName),
            new Claim(ClaimTypes.Surname, user.LastName),
            new Claim("UserType", user.UserType.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"],
            audience: _configuration["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public class SignUpRequest
{
    public required string Email { get; set; }
    public required string Password { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string SubscriptionStatus { get; set; } = "FREE";
}

public class LoginRequest
{
    public required string Email { get; set; }
    public required string Password { get; set; }
}

public class AuthResponse
{
    public required string Token { get; set; }
    public required UserDto User { get; set; }
}

public class UserDto
{
    public required string UserId { get; set; }
    public required string Email { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string UserType { get; set; }
    public required string SubscriptionStatus { get; set; }
    public required bool IsEmailVerified { get; set; }
    public required DateTime CreatedAt { get; set; }
}

public class VerifyEmailRequest
{
    public required string Code { get; set; }
}

public class ForgotPasswordRequest
{
    public required string Email { get; set; }
}

public class ResetPasswordRequest
{
    public required string Email { get; set; }
    public required string Code { get; set; }
    public required string NewPassword { get; set; }
}

public class SocialLoginRequest
{
    public required string Provider { get; set; } // "apple" or "google"
    public required string Token { get; set; }
    public required string Email { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
}

public class RegisterDeviceRequest
{
    public required string Token { get; set; }
    public required string Platform { get; set; } // "ios" or "android"
}
