using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FrugalBites.Models.Enums;

namespace FrugalBites.Models.Entities;

[Table("Merchants")]
public class Merchant
{
    [Key]
    [Column("MerchantId")]
    public Guid MerchantId { get; set; } = Guid.NewGuid();

    [Required]
    [Column("UserId")]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(255)]
    [Column("BusinessName")]
    public string BusinessName { get; set; } = string.Empty;

    [Required]
    [Column("BusinessType")]
    public BusinessType BusinessType { get; set; }

    [Column("Description")]
    public string? Description { get; set; }

    [Column("LogoUrl")]
    public string? LogoUrl { get; set; }

    [Column("CoverImageUrl")]
    public string? CoverImageUrl { get; set; }

    [Column("Latitude")]
    public decimal? Latitude { get; set; }

    [Column("Longitude")]
    public decimal? Longitude { get; set; }

    [MaxLength(255)]
    [Column("AddressLine1")]
    public string? AddressLine1 { get; set; }

    [MaxLength(255)]
    [Column("AddressLine2")]
    public string? AddressLine2 { get; set; }

    [MaxLength(100)]
    [Column("City")]
    public string? City { get; set; }

    [MaxLength(20)]
    [Column("PostalCode")]
    public string? PostalCode { get; set; }

    [MaxLength(2)]
    [Column("CountryCode")]
    public string? CountryCode { get; set; }

    [MaxLength(20)]
    [Column("PhoneNumber")]
    public string? PhoneNumber { get; set; }

    [Column("WebsiteUrl")]
    public string? WebsiteUrl { get; set; }

    [Column("OperatingHoursJson", TypeName = "TEXT")]
    public string? OperatingHoursJson { get; set; }

    [Column("PickupInstructions")]
    public string? PickupInstructions { get; set; }

    [Column("AverageRating")]
    public decimal AverageRating { get; set; } = 0;

    [Column("TotalReviews")]
    public int TotalReviews { get; set; } = 0;

    [Column("IsVerified")]
    public bool IsVerified { get; set; } = false;

    [MaxLength(255)]
    [Column("StripeAccountId")]
    public string? StripeAccountId { get; set; }

    [Column("CommissionRate")]
    public decimal CommissionRate { get; set; } = 5.0m;

    [Column("CreatedAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("UpdatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("IsActive")]
    public bool IsActive { get; set; } = true;

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    public virtual ICollection<Offer> Offers { get; set; } = new List<Offer>();
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
    public virtual ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public virtual ICollection<Analytics> Analytics { get; set; } = new List<Analytics>();
}