using FrugalBites.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FrugalBites.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // DbSets for entities
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Merchant> Merchants { get; set; } = null!;
    public DbSet<Offer> Offers { get; set; } = null!;
    public DbSet<Order> Orders { get; set; } = null!;
    public DbSet<Review> Reviews { get; set; } = null!;
    public DbSet<Favorite> Favorites { get; set; } = null!;
    public DbSet<Transaction> Transactions { get; set; } = null!;
    public DbSet<Analytics> Analytics { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure unique constraints
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Merchant>()
            .HasIndex(m => m.UserId)
            .IsUnique();

        modelBuilder.Entity<Favorite>()
            .HasIndex(f => new { f.UserId, f.MerchantId })
            .IsUnique();

        modelBuilder.Entity<Analytics>()
            .HasIndex(a => new { a.MerchantId, a.DateRecorded })
            .IsUnique();

        // Configure relationships
        modelBuilder.Entity<Merchant>()
            .HasOne(m => m.User)
            .WithOne(u => u.Merchant)
            .HasForeignKey<Merchant>(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Order>()
            .HasOne(o => o.User)
            .WithMany(u => u.Orders)
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Order>()
            .HasOne(o => o.Merchant)
            .WithMany(m => m.Orders)
            .HasForeignKey(o => o.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Order>()
            .HasOne(o => o.Offer)
            .WithMany(of => of.Orders)
            .HasForeignKey(o => o.OfferId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.Order)
            .WithOne(o => o.Review)
            .HasForeignKey<Review>(r => r.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Favorite>()
            .HasOne(f => f.User)
            .WithMany(u => u.Favorites)
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Favorite>()
            .HasOne(f => f.Merchant)
            .WithMany(m => m.Favorites)
            .HasForeignKey(f => f.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.Order)
            .WithOne(o => o.Transaction)
            .HasForeignKey<Transaction>(t => t.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure enum conversions for PostgreSQL
        modelBuilder.Entity<User>()
            .Property(u => u.UserType)
            .HasConversion<string>();

        modelBuilder.Entity<Merchant>()
            .Property(m => m.BusinessType)
            .HasConversion<string>();

        modelBuilder.Entity<Offer>()
            .Property(o => o.Category)
            .HasConversion<string>();

        modelBuilder.Entity<Offer>()
            .Property(o => o.QuantityUnit)
            .HasConversion<string>();

        modelBuilder.Entity<Offer>()
            .Property(o => o.Dietary)
            .HasConversion<string>();

        modelBuilder.Entity<Order>()
            .Property(o => o.OrderStatus)
            .HasConversion<string>();

        modelBuilder.Entity<Order>()
            .Property(o => o.PaymentStatus)
            .HasConversion<string>();

        modelBuilder.Entity<Transaction>()
            .Property(t => t.TransactionType)
            .HasConversion<string>();

        modelBuilder.Entity<Transaction>()
            .Property(t => t.Status)
            .HasConversion<string>();

        // Seed data for restaurants and offers near Bucharest, Intrarea Catedrei
        SeedBucharestData(modelBuilder);
    }

    private static void SeedBucharestData(ModelBuilder modelBuilder)
    {
        // Use static datetime for seed data
        var seedDateTime = new DateTime(2026, 1, 14, 12, 0, 0, DateTimeKind.Utc);
        var pickupNow = seedDateTime;
        var expirationTomorrow = DateOnly.FromDateTime(seedDateTime.AddDays(1));
        var expirationToday = DateOnly.FromDateTime(seedDateTime);

        // Create sample users for merchants
        var user1 = new User
        {
            UserId = new Guid("11111111-1111-1111-1111-111111111111"),
            Email = "pizzaroma@restaurant.com",
            FirstName = "Pizza",
            LastName = "Roma",
            UserType = Models.Enums.UserType.MERCHANT,
            CreatedAt = seedDateTime,
            UpdatedAt = seedDateTime
        };

        var user2 = new User
        {
            UserId = new Guid("22222222-2222-2222-2222-222222222222"),
            Email = "sushi@restaurant.com",
            FirstName = "Sushi",
            LastName = "Palace",
            UserType = Models.Enums.UserType.MERCHANT,
            CreatedAt = seedDateTime,
            UpdatedAt = seedDateTime
        };

        var user3 = new User
        {
            UserId = new Guid("33333333-3333-3333-3333-333333333333"),
            Email = "burgers@restaurant.com",
            FirstName = "Burger",
            LastName = "House",
            UserType = Models.Enums.UserType.MERCHANT,
            CreatedAt = seedDateTime,
            UpdatedAt = seedDateTime
        };

        var user4 = new User
        {
            UserId = new Guid("44444444-4444-4444-4444-444444444444"),
            Email = "vietnamese@restaurant.com",
            FirstName = "Pho",
            LastName = "Vietnam",
            UserType = Models.Enums.UserType.MERCHANT,
            CreatedAt = seedDateTime,
            UpdatedAt = seedDateTime
        };

        var user5 = new User
        {
            UserId = new Guid("55555555-5555-5555-5555-555555555555"),
            Email = "cafe@restaurant.com",
            FirstName = "Artisan",
            LastName = "Cafe",
            UserType = Models.Enums.UserType.MERCHANT,
            CreatedAt = seedDateTime,
            UpdatedAt = seedDateTime
        };

        var user6 = new User
        {
            UserId = new Guid("66666666-6666-6666-6666-666666666666"),
            Email = "greek@restaurant.com",
            FirstName = "Taverna",
            LastName = "Athena",
            UserType = Models.Enums.UserType.MERCHANT,
            CreatedAt = seedDateTime,
            UpdatedAt = seedDateTime
        };

        modelBuilder.Entity<User>().HasData(user1, user2, user3, user4, user5, user6);

        // Create merchant restaurants - Intrarea Catedrei area
        var merchant1 = new Merchant
        {
            MerchantId = new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            UserId = user1.UserId,
            BusinessName = "Pizza Roma",
            BusinessType = Models.Enums.BusinessType.RESTAURANT,
            Description = "Authentic Italian pizza and pasta near Cathedral",
            LogoUrl = "https://images.unsplash.com/photo-1608270861620-7299b3e330f0?w=100&h=100&fit=crop",
            CoverImageUrl = "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=500&h=200&fit=crop",
            Latitude = 44.4268m,
            Longitude = 26.0881m,
            AddressLine1 = "Intrarea Catedrei, 5",
            City = "Bucharest",
            PostalCode = "030015",
            CountryCode = "RO",
            AverageRating = 4.5m,
            CreatedAt = seedDateTime,
            UpdatedAt = seedDateTime
        };

        var merchant2 = new Merchant
        {
            MerchantId = new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            UserId = user2.UserId,
            BusinessName = "Sushi Palace",
            BusinessType = Models.Enums.BusinessType.RESTAURANT,
            Description = "Fresh sushi and Asian cuisine in the heart of Bucharest",
            LogoUrl = "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=100&h=100&fit=crop",
            CoverImageUrl = "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500&h=200&fit=crop",
            Latitude = 44.4275m,
            Longitude = 26.0890m,
            AddressLine1 = "Intrarea Catedrei, 12",
            City = "Bucharest",
            PostalCode = "030015",
            CountryCode = "RO",
            AverageRating = 4.8m,
            CreatedAt = seedDateTime,
            UpdatedAt = seedDateTime
        };

        var merchant3 = new Merchant
        {
            MerchantId = new Guid("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            UserId = user3.UserId,
            BusinessName = "Burger House",
            BusinessType = Models.Enums.BusinessType.RESTAURANT,
            Description = "Premium burgers and gourmet fast food",
            LogoUrl = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop",
            CoverImageUrl = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=200&fit=crop",
            Latitude = 44.4260m,
            Longitude = 26.0870m,
            AddressLine1 = "Calea Victoriei, 42",
            City = "Bucharest",
            PostalCode = "030023",
            CountryCode = "RO",
            AverageRating = 4.3m,
            CreatedAt = seedDateTime,
            UpdatedAt = seedDateTime
        };

        // Create merchant restaurants - Calea Victoriei area
        var merchant4 = new Merchant
        {
            MerchantId = new Guid("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            UserId = user4.UserId,
            BusinessName = "Pho Vietnam",
            BusinessType = Models.Enums.BusinessType.RESTAURANT,
            Description = "Authentic Vietnamese street food and pho",
            LogoUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop",
            CoverImageUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=200&fit=crop",
            Latitude = 44.4235m,
            Longitude = 26.0945m,
            AddressLine1 = "Calea Victoriei, 156",
            City = "Bucharest",
            PostalCode = "020022",
            CountryCode = "RO",
            AverageRating = 4.6m,
            CreatedAt = seedDateTime,
            UpdatedAt = seedDateTime
        };

        // Create merchant restaurants - Regie/Grozavesti area
        var merchant5 = new Merchant
        {
            MerchantId = new Guid("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            UserId = user5.UserId,
            BusinessName = "Artisan Cafe",
            BusinessType = Models.Enums.BusinessType.RESTAURANT,
            Description = "Specialty coffee and artisan pastries",
            LogoUrl = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=100&h=100&fit=crop",
            CoverImageUrl = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500&h=200&fit=crop",
            Latitude = 44.4650m,
            Longitude = 26.0580m,
            AddressLine1 = "Strada Grozavesti, 23",
            City = "Bucharest",
            PostalCode = "020748",
            CountryCode = "RO",
            AverageRating = 4.7m,
            CreatedAt = seedDateTime,
            UpdatedAt = seedDateTime
        };

        var merchant6 = new Merchant
        {
            MerchantId = new Guid("ffffffff-ffff-ffff-ffff-ffffffffffff"),
            UserId = user6.UserId,
            BusinessName = "Taverna Athena",
            BusinessType = Models.Enums.BusinessType.RESTAURANT,
            Description = "Traditional Greek cuisine and mezze plates",
            LogoUrl = "https://images.unsplash.com/photo-1555939594-58d7cb561482?w=100&h=100&fit=crop",
            CoverImageUrl = "https://images.unsplash.com/photo-1555939594-58d7cb561482?w=500&h=200&fit=crop",
            Latitude = 44.4645m,
            Longitude = 26.0595m,
            AddressLine1 = "Strada Regie, 8",
            City = "Bucharest",
            PostalCode = "020756",
            CountryCode = "RO",
            AverageRating = 4.4m,
            CreatedAt = seedDateTime,
            UpdatedAt = seedDateTime
        };

        modelBuilder.Entity<Merchant>().HasData(merchant1, merchant2, merchant3, merchant4, merchant5, merchant6);

        // Create offers for Pizza Roma
        var offer1 = new Offer
        {
            OfferId = new Guid("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            MerchantId = merchant1.MerchantId,
            FoodName = "Margherita Pizza",
            Description = "Classic Margherita pizza with fresh mozzarella and basil",
            Category = Models.Enums.OfferCategory.PREPARED_MEALS,
            OriginalPrice = 40.00m,
            DiscountedPrice = 20.00m,
            DiscountPercentage = 50,
            Quantity = 3,
            QuantityUnit = Models.Enums.QuantityUnit.PIECE,
            ImageUrl = "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=300&h=200&fit=crop",
            PickupStartTime = pickupNow.AddHours(1),
            PickupEndTime = pickupNow.AddHours(3),
            Dietary = Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = expirationTomorrow,
            IsAvailable = true,
            CreatedAt = pickupNow,
            UpdatedAt = pickupNow
        };

        var offer2 = new Offer
        {
            OfferId = new Guid("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            MerchantId = merchant1.MerchantId,
            FoodName = "Quattro Formaggi",
            Description = "Four cheese pizza with ricotta, mozzarella, parmesan and gorgonzola",
            Category = Models.Enums.OfferCategory.PREPARED_MEALS,
            OriginalPrice = 50.00m,
            DiscountedPrice = 25.00m,
            DiscountPercentage = 50,
            Quantity = 2,
            QuantityUnit = Models.Enums.QuantityUnit.PIECE,
            ImageUrl = "https://images.unsplash.com/photo-1571407-918cfff43dfb?w=300&h=200&fit=crop",
            PickupStartTime = pickupNow.AddHours(2),
            PickupEndTime = pickupNow.AddHours(4),
            Dietary = Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = expirationTomorrow,
            IsAvailable = true,
            CreatedAt = pickupNow,
            UpdatedAt = pickupNow
        };

        // Create offers for Sushi Palace
        var offer3 = new Offer
        {
            OfferId = new Guid("ffffffff-ffff-ffff-ffff-ffffffffffff"),
            MerchantId = merchant2.MerchantId,
            FoodName = "Salmon Sushi Roll",
            Description = "Fresh salmon, avocado, and cucumber sushi roll - 8 pieces",
            Category = Models.Enums.OfferCategory.PREPARED_MEALS,
            OriginalPrice = 60.00m,
            DiscountedPrice = 30.00m,
            DiscountPercentage = 50,
            Quantity = 2,
            QuantityUnit = Models.Enums.QuantityUnit.PACK,
            ImageUrl = "https://images.unsplash.com/photo-1553621042-f6e147245ba1?w=300&h=200&fit=crop",
            PickupStartTime = pickupNow.AddHours(1),
            PickupEndTime = pickupNow.AddHours(2),
            Dietary = Models.Enums.DietaryType.NONE,
            ExpirationDate = expirationToday,
            IsAvailable = true,
            CreatedAt = pickupNow,
            UpdatedAt = pickupNow
        };

        var offer4 = new Offer
        {
            OfferId = new Guid("11111111-1111-1111-1111-111111111112"),
            MerchantId = merchant2.MerchantId,
            FoodName = "Vegetable Tempura",
            Description = "Assorted fresh vegetables in light tempura batter",
            Category = Models.Enums.OfferCategory.PREPARED_MEALS,
            OriginalPrice = 38.00m,
            DiscountedPrice = 19.00m,
            DiscountPercentage = 50,
            Quantity = 4,
            QuantityUnit = Models.Enums.QuantityUnit.PORTION,
            ImageUrl = "https://images.unsplash.com/photo-1611680626919-8cf0cab20c51?w=300&h=200&fit=crop",
            PickupStartTime = pickupNow.AddHours(1),
            PickupEndTime = pickupNow.AddHours(3),
            Dietary = Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = expirationTomorrow,
            IsAvailable = true,
            CreatedAt = pickupNow,
            UpdatedAt = pickupNow
        };

        // Create offers for Burger House
        var offer5 = new Offer
        {
            OfferId = new Guid("22222222-2222-2222-2222-222222222222"),
            MerchantId = merchant3.MerchantId,
            FoodName = "Classic Cheeseburger",
            Description = "Juicy beef patty with cheddar cheese, lettuce, tomato and special sauce",
            Category = Models.Enums.OfferCategory.PREPARED_MEALS,
            OriginalPrice = 48.00m,
            DiscountedPrice = 24.00m,
            DiscountPercentage = 50,
            Quantity = 5,
            QuantityUnit = Models.Enums.QuantityUnit.PIECE,
            ImageUrl = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop",
            PickupStartTime = pickupNow.AddHours(1),
            PickupEndTime = pickupNow.AddHours(2),
            Dietary = Models.Enums.DietaryType.NONE,
            ExpirationDate = expirationToday,
            IsAvailable = true,
            CreatedAt = pickupNow,
            UpdatedAt = pickupNow
        };

        var offer6 = new Offer
        {
            OfferId = new Guid("33333333-3333-3333-3333-333333333333"),
            MerchantId = merchant3.MerchantId,
            FoodName = "Veggie Burger",
            Description = "Plant-based burger with grilled vegetables and vegan mayo",
            Category = Models.Enums.OfferCategory.PREPARED_MEALS,
            OriginalPrice = 42.00m,
            DiscountedPrice = 21.00m,
            DiscountPercentage = 50,
            Quantity = 3,
            QuantityUnit = Models.Enums.QuantityUnit.PIECE,
            ImageUrl = "https://images.unsplash.com/photo-1581887720020-91ec17a7a568?w=300&h=200&fit=crop",
            PickupStartTime = pickupNow.AddHours(2),
            PickupEndTime = pickupNow.AddHours(4),
            Dietary = Models.Enums.DietaryType.NONE,
            ExpirationDate = expirationTomorrow,
            IsAvailable = true,
            CreatedAt = pickupNow,
            UpdatedAt = pickupNow
        };

        // Create offers for Pho Vietnam (Calea Victoriei)
        var offer7 = new Offer
        {
            OfferId = new Guid("44444444-4444-4444-4444-444444444444"),
            MerchantId = merchant4.MerchantId,
            FoodName = "Beef Pho",
            Description = "Traditional Vietnamese beef pho with broth and rice noodles",
            Category = Models.Enums.OfferCategory.PREPARED_MEALS,
            OriginalPrice = 45.00m,
            DiscountedPrice = 22.50m,
            DiscountPercentage = 50,
            Quantity = 4,
            QuantityUnit = Models.Enums.QuantityUnit.PORTION,
            ImageUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop",
            PickupStartTime = pickupNow.AddHours(1),
            PickupEndTime = pickupNow.AddHours(2),
            Dietary = Models.Enums.DietaryType.NONE,
            ExpirationDate = expirationToday,
            IsAvailable = true,
            CreatedAt = pickupNow,
            UpdatedAt = pickupNow
        };

        var offer8 = new Offer
        {
            OfferId = new Guid("55555555-5555-5555-5555-555555555555"),
            MerchantId = merchant4.MerchantId,
            FoodName = "Vegetarian Pho",
            Description = "Fresh vegetarian pho with tofu and seasonal vegetables",
            Category = Models.Enums.OfferCategory.PREPARED_MEALS,
            OriginalPrice = 40.00m,
            DiscountedPrice = 20.00m,
            DiscountPercentage = 50,
            Quantity = 3,
            QuantityUnit = Models.Enums.QuantityUnit.PORTION,
            ImageUrl = "https://images.unsplash.com/photo-1588013273468-315fd88ea343?w=300&h=200&fit=crop",
            PickupStartTime = pickupNow.AddHours(2),
            PickupEndTime = pickupNow.AddHours(3),
            Dietary = Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = expirationTomorrow,
            IsAvailable = true,
            CreatedAt = pickupNow,
            UpdatedAt = pickupNow
        };

        // Create offers for Artisan Cafe (Regie/Grozavesti)
        var offer9 = new Offer
        {
            OfferId = new Guid("66666666-6666-6666-6666-666666666666"),
            MerchantId = merchant5.MerchantId,
            FoodName = "Croissant & Coffee Bundle",
            Description = "Fresh butter croissant with premium espresso or cappuccino",
            Category = Models.Enums.OfferCategory.PREPARED_MEALS,
            OriginalPrice = 32.00m,
            DiscountedPrice = 16.00m,
            DiscountPercentage = 50,
            Quantity = 6,
            QuantityUnit = Models.Enums.QuantityUnit.PACK,
            ImageUrl = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=300&h=200&fit=crop",
            PickupStartTime = pickupNow.AddHours(1),
            PickupEndTime = pickupNow.AddHours(2),
            Dietary = Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = expirationToday,
            IsAvailable = true,
            CreatedAt = pickupNow,
            UpdatedAt = pickupNow
        };

        var offer10 = new Offer
        {
            OfferId = new Guid("77777777-7777-7777-7777-777777777777"),
            MerchantId = merchant5.MerchantId,
            FoodName = "Almond Croissant",
            Description = "Delicate almond croissant with sliced almonds and powdered sugar",
            Category = Models.Enums.OfferCategory.PREPARED_MEALS,
            OriginalPrice = 28.00m,
            DiscountedPrice = 14.00m,
            DiscountPercentage = 50,
            Quantity = 4,
            QuantityUnit = Models.Enums.QuantityUnit.PIECE,
            ImageUrl = "https://images.unsplash.com/photo-1527521481379-d28b9fce3586?w=300&h=200&fit=crop",
            PickupStartTime = pickupNow.AddHours(1),
            PickupEndTime = pickupNow.AddHours(3),
            Dietary = Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = expirationToday,
            IsAvailable = true,
            CreatedAt = pickupNow,
            UpdatedAt = pickupNow
        };

        // Create offers for Taverna Athena (Regie/Grozavesti)
        var offer11 = new Offer
        {
            OfferId = new Guid("88888888-8888-8888-8888-888888888888"),
            MerchantId = merchant6.MerchantId,
            FoodName = "Greek Mezze Platter",
            Description = "Mix of tzatziki, hummus, feta, olives, bread and vegetables",
            Category = Models.Enums.OfferCategory.PREPARED_MEALS,
            OriginalPrice = 70.00m,
            DiscountedPrice = 35.00m,
            DiscountPercentage = 50,
            Quantity = 2,
            QuantityUnit = Models.Enums.QuantityUnit.PACK,
            ImageUrl = "https://images.unsplash.com/photo-1555939594-58d7cb561482?w=300&h=200&fit=crop",
            PickupStartTime = pickupNow.AddHours(1),
            PickupEndTime = pickupNow.AddHours(3),
            Dietary = Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = expirationTomorrow,
            IsAvailable = true,
            CreatedAt = pickupNow,
            UpdatedAt = pickupNow
        };

        var offer12 = new Offer
        {
            OfferId = new Guid("99999999-9999-9999-9999-999999999999"),
            MerchantId = merchant6.MerchantId,
            FoodName = "Grilled Lamb Souvlaki",
            Description = "Tender lamb souvlaki with pita bread and lemon potato",
            Category = Models.Enums.OfferCategory.PREPARED_MEALS,
            OriginalPrice = 68.00m,
            DiscountedPrice = 34.00m,
            DiscountPercentage = 50,
            Quantity = 2,
            QuantityUnit = Models.Enums.QuantityUnit.PACK,
            ImageUrl = "https://images.unsplash.com/photo-1599599810694-b3da7dd22d1d?w=300&h=200&fit=crop",
            PickupStartTime = pickupNow.AddHours(2),
            PickupEndTime = pickupNow.AddHours(4),
            Dietary = Models.Enums.DietaryType.NONE,
            ExpirationDate = expirationTomorrow,
            IsAvailable = true,
            CreatedAt = pickupNow,
            UpdatedAt = pickupNow
        };

        modelBuilder.Entity<Offer>().HasData(offer1, offer2, offer3, offer4, offer5, offer6, offer7, offer8, offer9, offer10, offer11, offer12);
    }
}