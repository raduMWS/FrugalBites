using FrugalBites.Models.Enums;

namespace FrugalBites.Models.DTOs;

public class OfferDTO
{
    public Guid OfferId { get; set; }
    public Guid MerchantId { get; set; }
    public string FoodName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public OfferCategory Category { get; set; }
    public decimal OriginalPrice { get; set; }
    public decimal DiscountedPrice { get; set; }
    public int DiscountPercentage { get; set; }
    public int Quantity { get; set; }
    public QuantityUnit QuantityUnit { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime PickupStartTime { get; set; }
    public DateTime PickupEndTime { get; set; }
    public object? Allergens { get; set; } // Will be deserialized from JSON
    public DietaryType Dietary { get; set; }
    public DateOnly? ExpirationDate { get; set; }
    public bool IsAvailable { get; set; }
    public DateTime CreatedAt { get; set; }

    // Merchant info for display
    public string MerchantName { get; set; } = string.Empty;
    public string? MerchantLogoUrl { get; set; }
    public decimal? MerchantRating { get; set; }
    public double? DistanceKm { get; set; }
}