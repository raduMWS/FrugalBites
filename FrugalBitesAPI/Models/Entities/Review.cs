using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FrugalBites.Models.Entities;

[Table("Reviews")]
public class Review
{
    [Key]
    [Column("ReviewId")]
    public Guid ReviewId { get; set; } = Guid.NewGuid();

    [Required]
    [Column("OrderId")]
    public Guid OrderId { get; set; }

    [Required]
    [Column("UserId")]
    public Guid UserId { get; set; }

    [Required]
    [Column("MerchantId")]
    public Guid MerchantId { get; set; }

    [Required]
    [Range(1, 5)]
    [Column("Rating")]
    public int Rating { get; set; }

    [Column("ReviewText")]
    public string? ReviewText { get; set; }

    [Column("CreatedAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("UpdatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("OrderId")]
    public virtual Order Order { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    [ForeignKey("MerchantId")]
    public virtual Merchant Merchant { get; set; } = null!;
}