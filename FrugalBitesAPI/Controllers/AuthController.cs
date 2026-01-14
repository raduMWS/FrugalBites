using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using FrugalBites.Models.Entities;
using FrugalBites.Data;
using FrugalBites.Models.Enums;

namespace FrugalBites.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("signup")]
    public async Task<ActionResult<AuthResponse>> Signup([FromBody] SignUpRequest request)
    {
        // Validate input
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email and password are required" });
        }

        // Check if user already exists
        var existingUser = _context.Users.FirstOrDefault(u => u.Email == request.Email);
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

    [HttpPost("login")]
    public ActionResult<AuthResponse> Login([FromBody] LoginRequest request)
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
        // In a real app, you might invalidate the token server-side
        // For now, client just discards the token
        return Ok(new { message = "Logged out successfully" });
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
