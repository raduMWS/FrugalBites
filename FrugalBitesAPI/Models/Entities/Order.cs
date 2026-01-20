using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FrugalBites.Models.Enums;

namespace FrugalBites.Models.Entities;

[Table("Orders")]
public class Order
{
    [Key]
    [Column("OrderId")]
    public Guid OrderId { get; set; } = Guid.NewGuid();

    [Required]
    [Column("UserId")]
    public Guid UserId { get; set; }

    [Required]
    [Column("MerchantId")]
    public Guid MerchantId { get; set; }

    [Required]
    [Column("OfferId")]
    public Guid OfferId { get; set; }

    [Required]
    [Column("Quantity")]
    public int Quantity { get; set; }

    [Required]
    [Column("TotalPrice", TypeName = "decimal(10,2)")]
    public decimal TotalPrice { get; set; }

    [Required]
    [Column("DiscountAmount", TypeName = "decimal(10,2)")]
    public decimal DiscountAmount { get; set; }

    [MaxLength(255)]
    [Column("PaymentMethodId")]
    public string? PaymentMethodId { get; set; }

    [Required]
    [Column("OrderStatus")]
    public OrderStatus OrderStatus { get; set; } = OrderStatus.PENDING;

    [Required]
    [Column("PaymentStatus")]
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.PENDING;

    [MaxLength(255)]
    [Column("StripePaymentIntentId")]
    public string? StripePaymentIntentId { get; set; }


    [Column("PickupTime")]
    public DateTime? PickupTime { get; set; }

    [Column("PickupStartTime")]
    public DateTime? PickupStartTime { get; set; }

    [Column("PickupEndTime")]
    public DateTime? PickupEndTime { get; set; }

    [Column("PickupConfirmedAt")]
    public DateTime? PickupConfirmedAt { get; set; }

    [Column("CancelledAt")]
    public DateTime? CancelledAt { get; set; }

    [MaxLength(255)]
    [Column("CancelReason")]
    public string? CancelReason { get; set; }

    [Column("CustomerNotes")]
    public string? CustomerNotes { get; set; }

    [Column("CreatedAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("UpdatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    [ForeignKey("MerchantId")]
    public virtual Merchant Merchant { get; set; } = null!;

    [ForeignKey("OfferId")]
    public virtual Offer Offer { get; set; } = null!;

    public virtual Review? Review { get; set; }
    public virtual Transaction? Transaction { get; set; }
}