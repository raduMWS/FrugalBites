using FrugalBites.Models.Enums;

namespace FrugalBites.Models.DTOs;

public class MerchantDTO
{
    public Guid MerchantId { get; set; }
    public Guid UserId { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public BusinessType BusinessType { get; set; }
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? PostalCode { get; set; }
    public string? CountryCode { get; set; }
    public string? PhoneNumber { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? OperatingHoursJson { get; set; }
    public string? PickupInstructions { get; set; }
    public decimal AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public bool IsVerified { get; set; }
    public string? StripeAccountId { get; set; }
    public decimal CommissionRate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsActive { get; set; }
}