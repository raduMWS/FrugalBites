using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FrugalBites.Models.Enums;

namespace FrugalBites.Models.Entities;

[Table("Transactions")]
public class Transaction
{
    [Key]
    [Column("TransactionId")]
    public Guid TransactionId { get; set; } = Guid.NewGuid();

    [Required]
    [Column("OrderId")]
    public Guid OrderId { get; set; }

    [Required]
    [Column("MerchantId")]
    public Guid MerchantId { get; set; }

    [Required]
    [Column("UserId")]
    public Guid UserId { get; set; }

    [Required]
    [Column("Amount", TypeName = "decimal(10,2)")]
    public decimal Amount { get; set; }

    [Required]
    [Column("CommissionAmount", TypeName = "decimal(10,2)")]
    public decimal CommissionAmount { get; set; }

    [Required]
    [Column("MerchantEarnings", TypeName = "decimal(10,2)")]
    public decimal MerchantEarnings { get; set; }

    [Required]
    [Column("TransactionType")]
    public TransactionType TransactionType { get; set; }

    [Required]
    [Column("Status")]
    public TransactionStatus Status { get; set; }

    [Column("CreatedAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("OrderId")]
    public virtual Order Order { get; set; } = null!;

    [ForeignKey("MerchantId")]
    public virtual Merchant Merchant { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}