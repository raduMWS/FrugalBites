using FrugalBites.Data;
using FrugalBites.Models.Entities;
using FrugalBites.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.FileProviders;
using AspNetCoreRateLimit;
using System.Text;
using BCrypt.Net;
using Serilog;

// Configure Serilog from appsettings.json
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(new ConfigurationBuilder()
        .AddJsonFile("appsettings.json")
        .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"}.json", optional: true)
        .Build())
    .CreateLogger();

try
{
    Log.Information("Starting FrugalBites API");

    var builder = WebApplication.CreateBuilder(args);
    
    // Configure Kestrel to listen on all interfaces for mobile device access
    builder.WebHost.ConfigureKestrel(serverOptions =>
    {
        serverOptions.ListenAnyIP(3000); // Listen on all interfaces
    });

    // Use Serilog for logging
    builder.Host.UseSerilog();

    // Add services to the container.
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
    builder.Services.AddHttpClient();

    // Register application services
    builder.Services.AddScoped<IEmailService, EmailService>();
    builder.Services.AddScoped<IQRCodeService, QRCodeService>();
    builder.Services.AddScoped<IPushNotificationService, PushNotificationService>();
    builder.Services.AddScoped<IImageUploadService, ImageUploadService>();

    // Add Rate Limiting
    builder.Services.AddMemoryCache();
    builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
    builder.Services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
    builder.Services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
    builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
    builder.Services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();
    builder.Services.AddInMemoryRateLimiting();

// Add JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
// Use environment variable for secret in production, fall back to config for development
var secret = Environment.GetEnvironmentVariable("JWT_SECRET") 
    ?? jwtSettings["Secret"] 
    ?? throw new InvalidOperationException("JWT secret is not configured. Set JWT_SECRET environment variable.");

// Validate secret length (should be at least 32 characters for HS256)
if (secret.Length < 32)
{
    throw new InvalidOperationException("JWT secret must be at least 32 characters long");
}

var key = Encoding.ASCII.GetBytes(secret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// Add database context
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add CORS
builder.Services.AddCors(options =>
{
    // Development policy - more permissive
    options.AddPolicy("Development", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });

    // Production policy - restricted to known origins
    options.AddPolicy("Production", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
            ?? new[] { "https://frugalbites.com" };
        
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Create uploads directory
var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads");
Directory.CreateDirectory(uploadsPath);

// Create database and tables
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.EnsureCreated();

    // Seed sample data if test user doesn't exist
    if (!dbContext.Users.Any(u => u.Email == "john.doe@example.com"))
    {
        SeedSampleData(dbContext);
    }
}

// Configure the HTTP request pipeline.
// Rate limiting middleware (should be early in pipeline)
app.UseIpRateLimiting();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Use environment-appropriate CORS policy
var corsPolicy = app.Environment.IsDevelopment() ? "Development" : "Production";
app.UseCors(corsPolicy);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

void SeedSampleData(ApplicationDbContext context)
{
    // Create sample users with properly hashed passwords
    var user1 = new FrugalBites.Models.Entities.User
    {
        Email = "john.doe@example.com",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
        FirstName = "John",
        LastName = "Doe",
        UserType = FrugalBites.Models.Enums.UserType.CONSUMER,
        IsEmailVerified = true,
        IsPhoneVerified = false,
        IsActive = true,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    var user2 = new FrugalBites.Models.Entities.User
    {
        Email = "sarah.bakery@example.com",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("bakery123"),
        FirstName = "Sarah",
        LastName = "Johnson",
        UserType = FrugalBites.Models.Enums.UserType.MERCHANT,
        IsEmailVerified = true,
        IsPhoneVerified = false,
        IsActive = true,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    context.Users.AddRange(user1, user2);
    context.SaveChanges();

    // Create sample merchants
    var merchant1 = new FrugalBites.Models.Entities.Merchant
    {
        UserId = user2.UserId,
        BusinessName = "Sarah's Bakery",
        BusinessType = FrugalBites.Models.Enums.BusinessType.BAKERY,
        AddressLine1 = "123 Main St",
        City = "Bucharest",
        PhoneNumber = "+40-721-123-456",
        Description = "Fresh baked goods daily",
        Latitude = 44.4268m,
        Longitude = 26.1025m,
        IsVerified = true,
        AverageRating = 4.7m,
        TotalReviews = 156,
        CreatedAt = DateTime.UtcNow,
        LogoUrl = "https://images.unsplash.com/photo-1517433670267-30f41c40f0f5?w=100&h=100&fit=crop",
        CoverImageUrl = "https://images.unsplash.com/photo-1517433670267-30f41c40f0f5?w=500&h=200&fit=crop"
    };

    // Create more merchant users
    var merchantUser2 = new FrugalBites.Models.Entities.User
    {
        Email = "bella.italia@example.com",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("pasta123"),
        FirstName = "Marco",
        LastName = "Rossi",
        UserType = FrugalBites.Models.Enums.UserType.MERCHANT,
        IsEmailVerified = true,
        IsActive = true,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    var merchantUser3 = new FrugalBites.Models.Entities.User
    {
        Email = "fresh.market@example.com",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("market123"),
        FirstName = "Ana",
        LastName = "Pop",
        UserType = FrugalBites.Models.Enums.UserType.MERCHANT,
        IsEmailVerified = true,
        IsActive = true,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    var merchantUser4 = new FrugalBites.Models.Entities.User
    {
        Email = "sushi.master@example.com",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("sushi123"),
        FirstName = "Yuki",
        LastName = "Tanaka",
        UserType = FrugalBites.Models.Enums.UserType.MERCHANT,
        IsEmailVerified = true,
        IsActive = true,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    var merchantUser5 = new FrugalBites.Models.Entities.User
    {
        Email = "green.cafe@example.com",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("green123"),
        FirstName = "Elena",
        LastName = "Verde",
        UserType = FrugalBites.Models.Enums.UserType.MERCHANT,
        IsEmailVerified = true,
        IsActive = true,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    // Additional merchant users
    var merchantUser6 = new FrugalBites.Models.Entities.User
    {
        Email = "grand.hotel@example.com",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("hotel123"),
        FirstName = "Alexandru",
        LastName = "Popescu",
        UserType = FrugalBites.Models.Enums.UserType.MERCHANT,
        IsEmailVerified = true,
        IsActive = true,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    var merchantUser7 = new FrugalBites.Models.Entities.User
    {
        Email = "taco.fiesta@example.com",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("taco123"),
        FirstName = "Carlos",
        LastName = "Martinez",
        UserType = FrugalBites.Models.Enums.UserType.MERCHANT,
        IsEmailVerified = true,
        IsActive = true,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    var merchantUser8 = new FrugalBites.Models.Entities.User
    {
        Email = "sweet.dreams@example.com",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("sweet123"),
        FirstName = "Maria",
        LastName = "Ionescu",
        UserType = FrugalBites.Models.Enums.UserType.MERCHANT,
        IsEmailVerified = true,
        IsActive = true,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    var merchantUser9 = new FrugalBites.Models.Entities.User
    {
        Email = "craft.coffee@example.com",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("coffee123"),
        FirstName = "Andrei",
        LastName = "Dumitru",
        UserType = FrugalBites.Models.Enums.UserType.MERCHANT,
        IsEmailVerified = true,
        IsActive = true,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    var merchantUser10 = new FrugalBites.Models.Entities.User
    {
        Email = "kebab.king@example.com",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("kebab123"),
        FirstName = "Mehmet",
        LastName = "Yilmaz",
        UserType = FrugalBites.Models.Enums.UserType.MERCHANT,
        IsEmailVerified = true,
        IsActive = true,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    context.Users.AddRange(merchantUser2, merchantUser3, merchantUser4, merchantUser5, merchantUser6, merchantUser7, merchantUser8, merchantUser9, merchantUser10);
    context.SaveChanges();

    var merchant2 = new FrugalBites.Models.Entities.Merchant
    {
        UserId = merchantUser2.UserId,
        BusinessName = "Bella Italia",
        BusinessType = FrugalBites.Models.Enums.BusinessType.RESTAURANT,
        AddressLine1 = "45 Calea Victoriei",
        City = "Bucharest",
        PhoneNumber = "+40-722-234-567",
        Description = "Authentic Italian cuisine with fresh ingredients",
        Latitude = 44.4350m,
        Longitude = 26.0970m,
        IsVerified = true,
        AverageRating = 4.5m,
        TotalReviews = 89,
        CreatedAt = DateTime.UtcNow,
        LogoUrl = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&h=100&fit=crop",
        CoverImageUrl = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&h=200&fit=crop"
    };

    var merchant3 = new FrugalBites.Models.Entities.Merchant
    {
        UserId = merchantUser3.UserId,
        BusinessName = "Fresh Market",
        BusinessType = FrugalBites.Models.Enums.BusinessType.SUPERMARKET,
        AddressLine1 = "78 Bulevardul Unirii",
        City = "Bucharest",
        PhoneNumber = "+40-723-345-678",
        Description = "Quality groceries at great prices",
        Latitude = 44.4200m,
        Longitude = 26.1100m,
        IsVerified = true,
        AverageRating = 4.3m,
        TotalReviews = 234,
        CreatedAt = DateTime.UtcNow,
        LogoUrl = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&h=100&fit=crop",
        CoverImageUrl = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&h=200&fit=crop"
    };

    var merchant4 = new FrugalBites.Models.Entities.Merchant
    {
        UserId = merchantUser4.UserId,
        BusinessName = "Sushi Master",
        BusinessType = FrugalBites.Models.Enums.BusinessType.RESTAURANT,
        AddressLine1 = "12 Strada Lipscani",
        City = "Bucharest",
        PhoneNumber = "+40-724-456-789",
        Description = "Premium sushi and Japanese delicacies",
        Latitude = 44.4310m,
        Longitude = 26.1050m,
        IsVerified = true,
        AverageRating = 4.8m,
        TotalReviews = 312,
        CreatedAt = DateTime.UtcNow,
        LogoUrl = "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=100&h=100&fit=crop",
        CoverImageUrl = "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&h=200&fit=crop"
    };

    var merchant5 = new FrugalBites.Models.Entities.Merchant
    {
        UserId = merchantUser5.UserId,
        BusinessName = "Green Leaf Café",
        BusinessType = FrugalBites.Models.Enums.BusinessType.CAFE,
        AddressLine1 = "33 Strada Franceza",
        City = "Bucharest",
        PhoneNumber = "+40-725-567-890",
        Description = "Healthy vegan and vegetarian options",
        Latitude = 44.4280m,
        Longitude = 26.0980m,
        IsVerified = true,
        AverageRating = 4.6m,
        TotalReviews = 178,
        CreatedAt = DateTime.UtcNow,
        LogoUrl = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=100&h=100&fit=crop",
        CoverImageUrl = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&h=200&fit=crop"
    };

    context.Merchants.AddRange(merchant1, merchant2, merchant3, merchant4, merchant5);
    context.SaveChanges();

    // Additional merchants
    var merchant6 = new FrugalBites.Models.Entities.Merchant
    {
        UserId = merchantUser6.UserId,
        BusinessName = "Grand Hotel Bucharest",
        BusinessType = FrugalBites.Models.Enums.BusinessType.HOTEL,
        AddressLine1 = "1 Piața Revoluției",
        City = "Bucharest",
        PhoneNumber = "+40-726-678-901",
        Description = "5-star hotel with award-winning restaurant and buffet",
        Latitude = 44.4395m,
        Longitude = 26.0963m,
        IsVerified = true,
        AverageRating = 4.9m,
        TotalReviews = 456,
        CreatedAt = DateTime.UtcNow,
        LogoUrl = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&h=100&fit=crop",
        CoverImageUrl = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=200&fit=crop"
    };

    var merchant7 = new FrugalBites.Models.Entities.Merchant
    {
        UserId = merchantUser7.UserId,
        BusinessName = "Taco Fiesta",
        BusinessType = FrugalBites.Models.Enums.BusinessType.RESTAURANT,
        AddressLine1 = "55 Strada Covaci",
        City = "Bucharest",
        PhoneNumber = "+40-727-789-012",
        Description = "Authentic Mexican street food and tacos",
        Latitude = 44.4320m,
        Longitude = 26.1020m,
        IsVerified = true,
        AverageRating = 4.4m,
        TotalReviews = 203,
        CreatedAt = DateTime.UtcNow,
        LogoUrl = "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=100&h=100&fit=crop",
        CoverImageUrl = "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&h=200&fit=crop"
    };

    var merchant8 = new FrugalBites.Models.Entities.Merchant
    {
        UserId = merchantUser8.UserId,
        BusinessName = "Sweet Dreams Patisserie",
        BusinessType = FrugalBites.Models.Enums.BusinessType.BAKERY,
        AddressLine1 = "22 Strada Doamnei",
        City = "Bucharest",
        PhoneNumber = "+40-728-890-123",
        Description = "French-inspired cakes, pastries, and desserts",
        Latitude = 44.4340m,
        Longitude = 26.0990m,
        IsVerified = true,
        AverageRating = 4.7m,
        TotalReviews = 287,
        CreatedAt = DateTime.UtcNow,
        LogoUrl = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&h=100&fit=crop",
        CoverImageUrl = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&h=200&fit=crop"
    };

    var merchant9 = new FrugalBites.Models.Entities.Merchant
    {
        UserId = merchantUser9.UserId,
        BusinessName = "Craft & Brew Coffee",
        BusinessType = FrugalBites.Models.Enums.BusinessType.CAFE,
        AddressLine1 = "88 Strada Gabroveni",
        City = "Bucharest",
        PhoneNumber = "+40-729-901-234",
        Description = "Specialty coffee roastery with fresh pastries",
        Latitude = 44.4290m,
        Longitude = 26.1030m,
        IsVerified = true,
        AverageRating = 4.6m,
        TotalReviews = 198,
        CreatedAt = DateTime.UtcNow,
        LogoUrl = "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=100&h=100&fit=crop",
        CoverImageUrl = "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&h=200&fit=crop"
    };

    var merchant10 = new FrugalBites.Models.Entities.Merchant
    {
        UserId = merchantUser10.UserId,
        BusinessName = "Kebab King",
        BusinessType = FrugalBites.Models.Enums.BusinessType.RESTAURANT,
        AddressLine1 = "99 Strada Selari",
        City = "Bucharest",
        PhoneNumber = "+40-730-012-345",
        Description = "Traditional Turkish kebabs and grilled meats",
        Latitude = 44.4305m,
        Longitude = 26.1010m,
        IsVerified = true,
        AverageRating = 4.3m,
        TotalReviews = 321,
        CreatedAt = DateTime.UtcNow,
        LogoUrl = "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=100&h=100&fit=crop",
        CoverImageUrl = "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500&h=200&fit=crop"
    };

    context.Merchants.AddRange(merchant6, merchant7, merchant8, merchant9, merchant10);
    context.SaveChanges();

    // Create sample offers - Premium Deals (40%+ discount) and Food Bundles (quantity > 1)
    var offers = new[]
    {
        // === PREMIUM DEALS (40%+ discount) ===
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant1.MerchantId,
            FoodName = "Fresh Croissants",
            Description = "Buttery croissants baked fresh this morning",
            OriginalPrice = 4.50m,
            DiscountedPrice = 2.25m,
            DiscountPercentage = 50,
            Quantity = 12,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PIECE,
            Category = FrugalBites.Models.Enums.OfferCategory.BAKERY,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(4)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(6),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant2.MerchantId,
            FoodName = "Pasta Carbonara Box",
            Description = "Creamy carbonara with crispy guanciale - chef's special!",
            OriginalPrice = 45.00m,
            DiscountedPrice = 22.50m,
            DiscountPercentage = 50,
            Quantity = 1,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.PREPARED_MEALS,
            Dietary = FrugalBites.Models.Enums.DietaryType.NONE,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(4),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant4.MerchantId,
            FoodName = "Premium Sushi Platter",
            Description = "12 pieces of assorted nigiri and maki rolls",
            OriginalPrice = 85.00m,
            DiscountedPrice = 42.50m,
            DiscountPercentage = 50,
            Quantity = 1,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.PREPARED_MEALS,
            Dietary = FrugalBites.Models.Enums.DietaryType.NONE,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(2)),
            PickupStartTime = DateTime.UtcNow.AddMinutes(30),
            PickupEndTime = DateTime.UtcNow.AddHours(3),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant5.MerchantId,
            FoodName = "Vegan Buddha Bowl",
            Description = "Quinoa, roasted veggies, avocado, and tahini dressing",
            OriginalPrice = 38.00m,
            DiscountedPrice = 15.20m,
            DiscountPercentage = 60,
            Quantity = 1,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.PREPARED_MEALS,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(4)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(5),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant3.MerchantId,
            FoodName = "Organic Fruit Box",
            Description = "Mixed seasonal fruits - apples, oranges, bananas, grapes",
            OriginalPrice = 55.00m,
            DiscountedPrice = 22.00m,
            DiscountPercentage = 60,
            Quantity = 1,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.GROCERIES,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(2)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(8),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant1.MerchantId,
            FoodName = "Artisan Bread Selection",
            Description = "3 loaves: sourdough, rye, and whole wheat",
            OriginalPrice = 32.00m,
            DiscountedPrice = 12.80m,
            DiscountPercentage = 60,
            Quantity = 3,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PIECE,
            Category = FrugalBites.Models.Enums.OfferCategory.BAKERY,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(6)),
            PickupStartTime = DateTime.UtcNow.AddHours(2),
            PickupEndTime = DateTime.UtcNow.AddHours(7),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=200&fit=crop"
        },

        // === FOOD BUNDLES (quantity > 1) ===
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant1.MerchantId,
            FoodName = "Chocolate Chip Cookies Pack",
            Description = "Box of 20 homemade cookies with premium chocolate chips",
            OriginalPrice = 35.00m,
            DiscountedPrice = 17.50m,
            DiscountPercentage = 50,
            Quantity = 20,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PIECE,
            Category = FrugalBites.Models.Enums.OfferCategory.BAKERY,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(8)),
            PickupStartTime = DateTime.UtcNow.AddHours(2),
            PickupEndTime = DateTime.UtcNow.AddHours(10),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant2.MerchantId,
            FoodName = "Italian Meal Bundle",
            Description = "2 pizzas, 2 pastas, garlic bread - feeds 4 people!",
            OriginalPrice = 120.00m,
            DiscountedPrice = 60.00m,
            DiscountPercentage = 50,
            Quantity = 4,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.PREPARED_MEALS,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(4),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant3.MerchantId,
            FoodName = "Dairy Essentials Bundle",
            Description = "Milk, cheese, yogurt, butter - weekly essentials pack",
            OriginalPrice = 65.00m,
            DiscountedPrice = 32.50m,
            DiscountPercentage = 50,
            Quantity = 6,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.GROCERIES,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(3)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(10),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant4.MerchantId,
            FoodName = "Sushi Party Pack",
            Description = "40 pieces of premium sushi - perfect for parties!",
            OriginalPrice = 180.00m,
            DiscountedPrice = 90.00m,
            DiscountPercentage = 50,
            Quantity = 40,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PIECE,
            Category = FrugalBites.Models.Enums.OfferCategory.PREPARED_MEALS,
            Dietary = FrugalBites.Models.Enums.DietaryType.NONE,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(2)),
            PickupStartTime = DateTime.UtcNow.AddMinutes(30),
            PickupEndTime = DateTime.UtcNow.AddHours(3),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1553621042-f6e147245754?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant5.MerchantId,
            FoodName = "Smoothie Bundle",
            Description = "5 fresh smoothies - mixed berry, green, tropical, mango, açai",
            OriginalPrice = 60.00m,
            DiscountedPrice = 30.00m,
            DiscountPercentage = 50,
            Quantity = 5,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.BEVERAGES,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(4)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(5),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant3.MerchantId,
            FoodName = "Vegetable Box",
            Description = "Fresh seasonal vegetables - tomatoes, peppers, zucchini, carrots",
            OriginalPrice = 45.00m,
            DiscountedPrice = 18.00m,
            DiscountPercentage = 60,
            Quantity = 8,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.GROCERIES,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(4)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(12),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant1.MerchantId,
            FoodName = "Pastry Assortment",
            Description = "10 mixed pastries: croissants, danishes, muffins, scones",
            OriginalPrice = 50.00m,
            DiscountedPrice = 20.00m,
            DiscountPercentage = 60,
            Quantity = 10,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PIECE,
            Category = FrugalBites.Models.Enums.OfferCategory.BAKERY,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(6),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?w=300&h=200&fit=crop"
        },

        // === MORE PREMIUM DEALS ===
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant2.MerchantId,
            FoodName = "Tiramisu Deluxe",
            Description = "Authentic Italian tiramisu made with mascarpone",
            OriginalPrice = 28.00m,
            DiscountedPrice = 11.20m,
            DiscountPercentage = 60,
            Quantity = 1,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.DESSERTS,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(6)),
            PickupStartTime = DateTime.UtcNow.AddHours(2),
            PickupEndTime = DateTime.UtcNow.AddHours(7),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant5.MerchantId,
            FoodName = "Avocado Toast Meal",
            Description = "Sourdough with smashed avocado, poached eggs, and seeds",
            OriginalPrice = 32.00m,
            DiscountedPrice = 12.80m,
            DiscountPercentage = 60,
            Quantity = 1,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.PREPARED_MEALS,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3)),
            PickupStartTime = DateTime.UtcNow.AddMinutes(30),
            PickupEndTime = DateTime.UtcNow.AddHours(4),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant4.MerchantId,
            FoodName = "Ramen Bowl",
            Description = "Rich tonkotsu broth with chashu pork, soft egg, and noodles",
            OriginalPrice = 42.00m,
            DiscountedPrice = 16.80m,
            DiscountPercentage = 60,
            Quantity = 1,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.PREPARED_MEALS,
            Dietary = FrugalBites.Models.Enums.DietaryType.NONE,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(2)),
            PickupStartTime = DateTime.UtcNow.AddMinutes(30),
            PickupEndTime = DateTime.UtcNow.AddHours(3),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=200&fit=crop"
        },

        // === HOTEL OFFERS ===
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant6.MerchantId,
            FoodName = "Breakfast Buffet Box",
            Description = "Full breakfast spread: eggs, bacon, pastries, fresh juice, and fruits",
            OriginalPrice = 75.00m,
            DiscountedPrice = 30.00m,
            DiscountPercentage = 60,
            Quantity = 1,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.PREPARED_MEALS,
            Dietary = FrugalBites.Models.Enums.DietaryType.NONE,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(4),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant6.MerchantId,
            FoodName = "Gourmet Dinner Set",
            Description = "3-course meal: soup, main course (beef/chicken), and dessert",
            OriginalPrice = 120.00m,
            DiscountedPrice = 48.00m,
            DiscountPercentage = 60,
            Quantity = 1,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.RESTAURANT,
            Dietary = FrugalBites.Models.Enums.DietaryType.NONE,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(4)),
            PickupStartTime = DateTime.UtcNow.AddHours(2),
            PickupEndTime = DateTime.UtcNow.AddHours(6),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1544025162-d76694265947?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant6.MerchantId,
            FoodName = "Catering Leftovers Box",
            Description = "Assorted canapés, sandwiches, and finger food from events",
            OriginalPrice = 200.00m,
            DiscountedPrice = 60.00m,
            DiscountPercentage = 70,
            Quantity = 20,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PIECE,
            Category = FrugalBites.Models.Enums.OfferCategory.PREPARED_MEALS,
            Dietary = FrugalBites.Models.Enums.DietaryType.NONE,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(6),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1555244162-803834f70033?w=300&h=200&fit=crop"
        },

        // === MEXICAN RESTAURANT OFFERS ===
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant7.MerchantId,
            FoodName = "Taco Trio",
            Description = "3 tacos: carnitas, al pastor, and carne asada with all toppings",
            OriginalPrice = 28.00m,
            DiscountedPrice = 11.20m,
            DiscountPercentage = 60,
            Quantity = 3,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PIECE,
            Category = FrugalBites.Models.Enums.OfferCategory.RESTAURANT,
            Dietary = FrugalBites.Models.Enums.DietaryType.NONE,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(4),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant7.MerchantId,
            FoodName = "Burrito Bowl",
            Description = "Rice, beans, guacamole, salsa, cheese, and choice of protein",
            OriginalPrice = 35.00m,
            DiscountedPrice = 14.00m,
            DiscountPercentage = 60,
            Quantity = 1,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.PREPARED_MEALS,
            Dietary = FrugalBites.Models.Enums.DietaryType.NONE,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(4)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(5),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant7.MerchantId,
            FoodName = "Nachos Supreme Party Pack",
            Description = "Large nachos with cheese, jalapeños, guacamole, sour cream - serves 4",
            OriginalPrice = 55.00m,
            DiscountedPrice = 22.00m,
            DiscountPercentage = 60,
            Quantity = 4,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PORTION,
            Category = FrugalBites.Models.Enums.OfferCategory.RESTAURANT,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(4),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=300&h=200&fit=crop"
        },

        // === PATISSERIE/DESSERT OFFERS ===
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant8.MerchantId,
            FoodName = "Macarons Box",
            Description = "12 assorted French macarons - vanilla, chocolate, pistachio, rose, lemon, caramel",
            OriginalPrice = 48.00m,
            DiscountedPrice = 19.20m,
            DiscountPercentage = 60,
            Quantity = 12,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PIECE,
            Category = FrugalBites.Models.Enums.OfferCategory.DESSERTS,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(2)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(8),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant8.MerchantId,
            FoodName = "Chocolate Cake Slice",
            Description = "Rich dark chocolate ganache cake with Belgian chocolate",
            OriginalPrice = 22.00m,
            DiscountedPrice = 8.80m,
            DiscountPercentage = 60,
            Quantity = 1,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PIECE,
            Category = FrugalBites.Models.Enums.OfferCategory.DESSERTS,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(6)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(7),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant8.MerchantId,
            FoodName = "Éclair Collection",
            Description = "6 French éclairs: chocolate, coffee, vanilla, caramel, pistachio, strawberry",
            OriginalPrice = 42.00m,
            DiscountedPrice = 16.80m,
            DiscountPercentage = 60,
            Quantity = 6,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PIECE,
            Category = FrugalBites.Models.Enums.OfferCategory.DESSERTS,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(8)),
            PickupStartTime = DateTime.UtcNow.AddHours(2),
            PickupEndTime = DateTime.UtcNow.AddHours(9),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant8.MerchantId,
            FoodName = "Cheesecake Paradise",
            Description = "New York style cheesecake with berry compote",
            OriginalPrice = 35.00m,
            DiscountedPrice = 14.00m,
            DiscountPercentage = 60,
            Quantity = 1,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PIECE,
            Category = FrugalBites.Models.Enums.OfferCategory.DESSERTS,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(10),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&h=200&fit=crop"
        },

        // === COFFEE SHOP/BEVERAGES OFFERS ===
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant9.MerchantId,
            FoodName = "Cold Brew Coffee Pack",
            Description = "4 bottles of house-made cold brew concentrate",
            OriginalPrice = 40.00m,
            DiscountedPrice = 16.00m,
            DiscountPercentage = 60,
            Quantity = 4,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.BEVERAGES,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(12),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant9.MerchantId,
            FoodName = "Matcha Latte & Muffin Combo",
            Description = "Premium matcha latte with a fresh blueberry muffin",
            OriginalPrice = 24.00m,
            DiscountedPrice = 9.60m,
            DiscountPercentage = 60,
            Quantity = 1,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.BEVERAGES,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(4)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(5),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant9.MerchantId,
            FoodName = "Fresh Juice Trio",
            Description = "3 fresh-pressed juices: orange, green detox, and carrot-ginger",
            OriginalPrice = 36.00m,
            DiscountedPrice = 14.40m,
            DiscountPercentage = 60,
            Quantity = 3,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.BEVERAGES,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(6)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(7),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=300&h=200&fit=crop"
        },

        // === KEBAB RESTAURANT OFFERS ===
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant10.MerchantId,
            FoodName = "Mixed Kebab Platter",
            Description = "Chicken, lamb, and beef kebabs with rice, salad, and sauces",
            OriginalPrice = 55.00m,
            DiscountedPrice = 22.00m,
            DiscountPercentage = 60,
            Quantity = 1,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.RESTAURANT,
            Dietary = FrugalBites.Models.Enums.DietaryType.NONE,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(4),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant10.MerchantId,
            FoodName = "Döner Wrap Duo",
            Description = "2 classic döner wraps with garlic sauce and fresh veggies",
            OriginalPrice = 32.00m,
            DiscountedPrice = 12.80m,
            DiscountPercentage = 60,
            Quantity = 2,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PIECE,
            Category = FrugalBites.Models.Enums.OfferCategory.PREPARED_MEALS,
            Dietary = FrugalBites.Models.Enums.DietaryType.NONE,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(2)),
            PickupStartTime = DateTime.UtcNow.AddMinutes(30),
            PickupEndTime = DateTime.UtcNow.AddHours(3),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1633321702518-7feccafb94d5?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant10.MerchantId,
            FoodName = "Falafel Box",
            Description = "8 fresh falafels with hummus, tahini, and pita bread",
            OriginalPrice = 28.00m,
            DiscountedPrice = 11.20m,
            DiscountPercentage = 60,
            Quantity = 8,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PIECE,
            Category = FrugalBites.Models.Enums.OfferCategory.PREPARED_MEALS,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(6),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?w=300&h=200&fit=crop"
        },

        // === MORE GROCERIES ===
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant3.MerchantId,
            FoodName = "Bread & Bakery Bundle",
            Description = "Assorted breads approaching best-by date - 5 loaves/rolls",
            OriginalPrice = 25.00m,
            DiscountedPrice = 7.50m,
            DiscountPercentage = 70,
            Quantity = 5,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PIECE,
            Category = FrugalBites.Models.Enums.OfferCategory.GROCERIES,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(10),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant3.MerchantId,
            FoodName = "Deli Meat Selection",
            Description = "Assorted cold cuts: ham, turkey, salami - near expiry",
            OriginalPrice = 45.00m,
            DiscountedPrice = 18.00m,
            DiscountPercentage = 60,
            Quantity = 1,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.GROCERIES,
            Dietary = FrugalBites.Models.Enums.DietaryType.NONE,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(2)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(12),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant3.MerchantId,
            FoodName = "Yogurt & Dairy Mix",
            Description = "6 assorted yogurts and dairy drinks near best-by date",
            OriginalPrice = 30.00m,
            DiscountedPrice = 9.00m,
            DiscountPercentage = 70,
            Quantity = 6,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PIECE,
            Category = FrugalBites.Models.Enums.OfferCategory.GROCERIES,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(3)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(12),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=200&fit=crop"
        },

        // === MORE BAKERY ===
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant1.MerchantId,
            FoodName = "Cinnamon Rolls Pack",
            Description = "6 freshly baked cinnamon rolls with cream cheese frosting",
            OriginalPrice = 30.00m,
            DiscountedPrice = 12.00m,
            DiscountPercentage = 60,
            Quantity = 6,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PIECE,
            Category = FrugalBites.Models.Enums.OfferCategory.BAKERY,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(8)),
            PickupStartTime = DateTime.UtcNow.AddHours(2),
            PickupEndTime = DateTime.UtcNow.AddHours(9),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1609127437165-4b9c2d8c1b5c?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant1.MerchantId,
            FoodName = "Bagel Dozen",
            Description = "12 assorted bagels: plain, sesame, everything, onion",
            OriginalPrice = 36.00m,
            DiscountedPrice = 14.40m,
            DiscountPercentage = 60,
            Quantity = 12,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PIECE,
            Category = FrugalBites.Models.Enums.OfferCategory.BAKERY,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(6)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(7),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1585445490387-f47934b73b54?w=300&h=200&fit=crop"
        },

        // === MORE RESTAURANT OFFERS ===
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant2.MerchantId,
            FoodName = "Lasagna Family Size",
            Description = "Traditional beef lasagna - serves 4-6 people",
            OriginalPrice = 65.00m,
            DiscountedPrice = 26.00m,
            DiscountPercentage = 60,
            Quantity = 1,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.RESTAURANT,
            Dietary = FrugalBites.Models.Enums.DietaryType.NONE,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(4)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(5),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant2.MerchantId,
            FoodName = "Margherita Pizza",
            Description = "Classic margherita with fresh mozzarella and basil",
            OriginalPrice = 38.00m,
            DiscountedPrice = 15.20m,
            DiscountPercentage = 60,
            Quantity = 1,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PIECE,
            Category = FrugalBites.Models.Enums.OfferCategory.RESTAURANT,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3)),
            PickupStartTime = DateTime.UtcNow.AddMinutes(30),
            PickupEndTime = DateTime.UtcNow.AddHours(4),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant4.MerchantId,
            FoodName = "Bento Box Special",
            Description = "Complete bento: salmon teriyaki, rice, gyoza, miso soup, salad",
            OriginalPrice = 48.00m,
            DiscountedPrice = 19.20m,
            DiscountPercentage = 60,
            Quantity = 1,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.RESTAURANT,
            Dietary = FrugalBites.Models.Enums.DietaryType.NONE,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(4),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant4.MerchantId,
            FoodName = "Gyoza Platter",
            Description = "15 pan-fried pork gyoza with dipping sauce",
            OriginalPrice = 35.00m,
            DiscountedPrice = 14.00m,
            DiscountPercentage = 60,
            Quantity = 15,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PIECE,
            Category = FrugalBites.Models.Enums.OfferCategory.RESTAURANT,
            Dietary = FrugalBites.Models.Enums.DietaryType.NONE,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(2)),
            PickupStartTime = DateTime.UtcNow.AddMinutes(30),
            PickupEndTime = DateTime.UtcNow.AddHours(3),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=300&h=200&fit=crop"
        },

        // === OTHER CATEGORY ===
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant5.MerchantId,
            FoodName = "Mystery Box",
            Description = "Chef's surprise selection of the day - always a treat!",
            OriginalPrice = 40.00m,
            DiscountedPrice = 12.00m,
            DiscountPercentage = 70,
            Quantity = 1,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.OTHER,
            Dietary = FrugalBites.Models.Enums.DietaryType.VEGETARIAN,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(4)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(5),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop"
        },
        new FrugalBites.Models.Entities.Offer
        {
            MerchantId = merchant6.MerchantId,
            FoodName = "Event Surplus Box",
            Description = "Mixed food from today's event - premium quality, random items",
            OriginalPrice = 80.00m,
            DiscountedPrice = 24.00m,
            DiscountPercentage = 70,
            Quantity = 1,
            QuantityUnit = FrugalBites.Models.Enums.QuantityUnit.PACK,
            Category = FrugalBites.Models.Enums.OfferCategory.OTHER,
            Dietary = FrugalBites.Models.Enums.DietaryType.NONE,
            ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3)),
            PickupStartTime = DateTime.UtcNow.AddHours(1),
            PickupEndTime = DateTime.UtcNow.AddHours(4),
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=200&fit=crop"
        }
    };

    context.Offers.AddRange(offers);
    context.SaveChanges();
    
    Log.Information("Sample data seeded successfully");
}

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
