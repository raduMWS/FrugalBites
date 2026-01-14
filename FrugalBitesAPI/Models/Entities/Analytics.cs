using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FrugalBites.Models.Entities;

[Table("Analytics")]
public class Analytics
{
    [Key]
    [Column("AnalyticsId")]
    public Guid AnalyticsId { get; set; } = Guid.NewGuid();

    [Required]
    [Column("MerchantId")]
    public Guid MerchantId { get; set; }

    [Required]
    [Column("DateRecorded")]
    public DateOnly DateRecorded { get; set; }

    [Column("OffersCreated")]
    public int OffersCreated { get; set; } = 0;

    [Column("OffersPurchased")]
    public int OffersPurchased { get; set; } = 0;

    [Column("FoodSavedKg", TypeName = "decimal(10,2)")]
    public decimal FoodSavedKg { get; set; } = 0;

    [Column("RevenueGenerated", TypeName = "decimal(10,2)")]
    public decimal RevenueGenerated { get; set; } = 0;

    [Column("TopOrderTime")]
    public TimeOnly? TopOrderTime { get; set; }

    [Column("CreatedAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    [ForeignKey("MerchantId")]
    public virtual Merchant Merchant { get; set; } = null!;
}