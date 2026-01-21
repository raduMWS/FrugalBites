    [Column("IsPremium")]
    public bool IsPremium { get; set; } = false;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FrugalBites.Models.Enums;

namespace FrugalBites.Models.Entities;

[Table("Users")]
public class User
{
    [Key]
    [Column("UserId")]
    public Guid UserId { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(255)]
    [Column("Email")]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    [Column("PasswordHash")]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(20)]
    [Column("PhoneNumber")]
    public string? PhoneNumber { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("FirstName")]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("LastName")]
    public string LastName { get; set; } = string.Empty;

    [Column("ProfileImageUrl")]
    public string? ProfileImageUrl { get; set; }

    [Required]
    [Column("UserType")]
    public UserType UserType { get; set; }

    [Column("IsEmailVerified")]
    public bool IsEmailVerified { get; set; } = false;

    [Column("IsPhoneVerified")]
    public bool IsPhoneVerified { get; set; } = false;

    [Column("CreatedAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("UpdatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("LastLoginAt")]
    public DateTime? LastLoginAt { get; set; }

    [Column("IsActive")]
    public bool IsActive { get; set; } = true;

    [Column("DeletedAt")]
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public virtual Merchant? Merchant { get; set; }
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
    public virtual ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}