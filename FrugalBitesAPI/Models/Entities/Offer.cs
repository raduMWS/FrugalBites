using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FrugalBites.Models.Enums;

namespace FrugalBites.Models.Entities;

[Table("Offers")]
public class Offer
{
    [Key]
    [Column("OfferId")]
    public Guid OfferId { get; set; } = Guid.NewGuid();

    [Required]
    [Column("MerchantId")]
    public Guid MerchantId { get; set; }

    [Required]
    [MaxLength(255)]
    [Column("FoodName")]
    public string FoodName { get; set; } = string.Empty;

    [Column("Description")]
    public string? Description { get; set; }

    [Required]
    [Column("Category")]
    public OfferCategory Category { get; set; }

    [Required]
    [Column("OriginalPrice", TypeName = "decimal(10,2)")]
    public decimal OriginalPrice { get; set; }

    [Required]
    [Column("DiscountedPrice", TypeName = "decimal(10,2)")]
    public decimal DiscountedPrice { get; set; }

    [Required]
    [Column("DiscountPercentage")]
    public int DiscountPercentage { get; set; }

    [Required]
    [Column("Quantity")]
    public int Quantity { get; set; }

    [Required]
    [Column("QuantityUnit")]
    public QuantityUnit QuantityUnit { get; set; }

    [Column("ImageUrl")]
    public string? ImageUrl { get; set; }

    [Required]
    [Column("PickupStartTime")]
    public DateTime PickupStartTime { get; set; }

    [Required]
    [Column("PickupEndTime")]
    public DateTime PickupEndTime { get; set; }

    [Column("AllergensJson", TypeName = "TEXT")]
    public string? AllergensJson { get; set; }

    [Column("Dietary")]
    public DietaryType Dietary { get; set; } = DietaryType.NONE;

    [Column("ExpirationDate")]
    public DateOnly? ExpirationDate { get; set; }

    [Column("IsAvailable")]
    public bool IsAvailable { get; set; } = true;

    [Column("CreatedAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("UpdatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("MerchantId")]
    public virtual Merchant Merchant { get; set; } = null!;

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
}