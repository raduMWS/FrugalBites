using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FrugalBites.Models.Entities;

[Table("Favorites")]
public class Favorite
{
    [Key]
    [Column("FavoriteId")]
    public Guid FavoriteId { get; set; } = Guid.NewGuid();

    [Required]
    [Column("UserId")]
    public Guid UserId { get; set; }

    [Required]
    [Column("MerchantId")]
    public Guid MerchantId { get; set; }

    [Column("CreatedAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    [ForeignKey("MerchantId")]
    public virtual Merchant Merchant { get; set; } = null!;
}