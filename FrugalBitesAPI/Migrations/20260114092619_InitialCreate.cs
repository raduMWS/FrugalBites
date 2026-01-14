using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FrugalBites.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    PhoneNumber = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    FirstName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    ProfileImageUrl = table.Column<string>(type: "TEXT", nullable: true),
                    UserType = table.Column<string>(type: "TEXT", nullable: false),
                    IsEmailVerified = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsPhoneVerified = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.UserId);
                });

            migrationBuilder.CreateTable(
                name: "Merchants",
                columns: table => new
                {
                    MerchantId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    BusinessName = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    BusinessType = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    LogoUrl = table.Column<string>(type: "TEXT", nullable: true),
                    CoverImageUrl = table.Column<string>(type: "TEXT", nullable: true),
                    Latitude = table.Column<decimal>(type: "TEXT", nullable: true),
                    Longitude = table.Column<decimal>(type: "TEXT", nullable: true),
                    AddressLine1 = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    AddressLine2 = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    City = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    PostalCode = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    CountryCode = table.Column<string>(type: "TEXT", maxLength: 2, nullable: true),
                    PhoneNumber = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    WebsiteUrl = table.Column<string>(type: "TEXT", nullable: true),
                    OperatingHoursJson = table.Column<string>(type: "TEXT", nullable: true),
                    PickupInstructions = table.Column<string>(type: "TEXT", nullable: true),
                    AverageRating = table.Column<decimal>(type: "TEXT", nullable: false),
                    TotalReviews = table.Column<int>(type: "INTEGER", nullable: false),
                    IsVerified = table.Column<bool>(type: "INTEGER", nullable: false),
                    StripeAccountId = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    CommissionRate = table.Column<decimal>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Merchants", x => x.MerchantId);
                    table.ForeignKey(
                        name: "FK_Merchants_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Analytics",
                columns: table => new
                {
                    AnalyticsId = table.Column<Guid>(type: "TEXT", nullable: false),
                    MerchantId = table.Column<Guid>(type: "TEXT", nullable: false),
                    DateRecorded = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    OffersCreated = table.Column<int>(type: "INTEGER", nullable: false),
                    OffersPurchased = table.Column<int>(type: "INTEGER", nullable: false),
                    FoodSavedKg = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    RevenueGenerated = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    TopOrderTime = table.Column<TimeOnly>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Analytics", x => x.AnalyticsId);
                    table.ForeignKey(
                        name: "FK_Analytics_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "MerchantId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Favorites",
                columns: table => new
                {
                    FavoriteId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    MerchantId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Favorites", x => x.FavoriteId);
                    table.ForeignKey(
                        name: "FK_Favorites_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "MerchantId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Favorites_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Offers",
                columns: table => new
                {
                    OfferId = table.Column<Guid>(type: "TEXT", nullable: false),
                    MerchantId = table.Column<Guid>(type: "TEXT", nullable: false),
                    FoodName = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    Category = table.Column<string>(type: "TEXT", nullable: false),
                    OriginalPrice = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    DiscountedPrice = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    DiscountPercentage = table.Column<int>(type: "INTEGER", nullable: false),
                    Quantity = table.Column<int>(type: "INTEGER", nullable: false),
                    QuantityUnit = table.Column<string>(type: "TEXT", nullable: false),
                    ImageUrl = table.Column<string>(type: "TEXT", nullable: true),
                    PickupStartTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    PickupEndTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    AllergensJson = table.Column<string>(type: "TEXT", nullable: true),
                    Dietary = table.Column<string>(type: "TEXT", nullable: false),
                    ExpirationDate = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    IsAvailable = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Offers", x => x.OfferId);
                    table.ForeignKey(
                        name: "FK_Offers_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "MerchantId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Orders",
                columns: table => new
                {
                    OrderId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    MerchantId = table.Column<Guid>(type: "TEXT", nullable: false),
                    OfferId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Quantity = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalPrice = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    DiscountAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    PaymentMethodId = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    OrderStatus = table.Column<string>(type: "TEXT", nullable: false),
                    PaymentStatus = table.Column<string>(type: "TEXT", nullable: false),
                    StripePaymentIntentId = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    PickupTime = table.Column<DateTime>(type: "TEXT", nullable: true),
                    PickupConfirmedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CancelReason = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    CustomerNotes = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Orders", x => x.OrderId);
                    table.ForeignKey(
                        name: "FK_Orders_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "MerchantId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Orders_Offers_OfferId",
                        column: x => x.OfferId,
                        principalTable: "Offers",
                        principalColumn: "OfferId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Orders_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    ReviewId = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrderId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    MerchantId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Rating = table.Column<int>(type: "INTEGER", nullable: false),
                    ReviewText = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reviews", x => x.ReviewId);
                    table.ForeignKey(
                        name: "FK_Reviews_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "MerchantId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Reviews_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Reviews_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Transactions",
                columns: table => new
                {
                    TransactionId = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrderId = table.Column<Guid>(type: "TEXT", nullable: false),
                    MerchantId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    CommissionAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    MerchantEarnings = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    TransactionType = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Transactions", x => x.TransactionId);
                    table.ForeignKey(
                        name: "FK_Transactions_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalTable: "Merchants",
                        principalColumn: "MerchantId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Transactions_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Transactions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "UserId", "CreatedAt", "DeletedAt", "Email", "FirstName", "IsActive", "IsEmailVerified", "IsPhoneVerified", "LastLoginAt", "LastName", "PasswordHash", "PhoneNumber", "ProfileImageUrl", "UpdatedAt", "UserType" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), null, "pizzaroma@restaurant.com", "Pizza", true, false, false, null, "Roma", "", null, null, new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "MERCHANT" },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), null, "sushi@restaurant.com", "Sushi", true, false, false, null, "Palace", "", null, null, new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "MERCHANT" },
                    { new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), null, "burgers@restaurant.com", "Burger", true, false, false, null, "House", "", null, null, new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "MERCHANT" },
                    { new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), null, "vietnamese@restaurant.com", "Pho", true, false, false, null, "Vietnam", "", null, null, new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "MERCHANT" },
                    { new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), null, "cafe@restaurant.com", "Artisan", true, false, false, null, "Cafe", "", null, null, new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "MERCHANT" },
                    { new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), null, "greek@restaurant.com", "Taverna", true, false, false, null, "Athena", "", null, null, new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "MERCHANT" }
                });

            migrationBuilder.InsertData(
                table: "Merchants",
                columns: new[] { "MerchantId", "AddressLine1", "AddressLine2", "AverageRating", "BusinessName", "BusinessType", "City", "CommissionRate", "CountryCode", "CoverImageUrl", "CreatedAt", "Description", "IsActive", "IsVerified", "Latitude", "LogoUrl", "Longitude", "OperatingHoursJson", "PhoneNumber", "PickupInstructions", "PostalCode", "StripeAccountId", "TotalReviews", "UpdatedAt", "UserId", "WebsiteUrl" },
                values: new object[,]
                {
                    { new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), "Intrarea Catedrei, 5", null, 4.5m, "Pizza Roma", "RESTAURANT", "Bucharest", 5.0m, "RO", "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=500&h=200&fit=crop", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "Authentic Italian pizza and pasta near Cathedral", true, false, 44.4268m, "https://images.unsplash.com/photo-1608270861620-7299b3e330f0?w=100&h=100&fit=crop", 26.0881m, null, null, null, "030015", null, 0, new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), new Guid("11111111-1111-1111-1111-111111111111"), null },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), "Intrarea Catedrei, 12", null, 4.8m, "Sushi Palace", "RESTAURANT", "Bucharest", 5.0m, "RO", "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500&h=200&fit=crop", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "Fresh sushi and Asian cuisine in the heart of Bucharest", true, false, 44.4275m, "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=100&h=100&fit=crop", 26.0890m, null, null, null, "030015", null, 0, new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), new Guid("22222222-2222-2222-2222-222222222222"), null },
                    { new Guid("cccccccc-cccc-cccc-cccc-cccccccccccc"), "Calea Victoriei, 42", null, 4.3m, "Burger House", "RESTAURANT", "Bucharest", 5.0m, "RO", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=200&fit=crop", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "Premium burgers and gourmet fast food", true, false, 44.4260m, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop", 26.0870m, null, null, null, "030023", null, 0, new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), new Guid("33333333-3333-3333-3333-333333333333"), null },
                    { new Guid("dddddddd-dddd-dddd-dddd-dddddddddddd"), "Calea Victoriei, 156", null, 4.6m, "Pho Vietnam", "RESTAURANT", "Bucharest", 5.0m, "RO", "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=200&fit=crop", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "Authentic Vietnamese street food and pho", true, false, 44.4235m, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop", 26.0945m, null, null, null, "020022", null, 0, new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), new Guid("44444444-4444-4444-4444-444444444444"), null },
                    { new Guid("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"), "Strada Grozavesti, 23", null, 4.7m, "Artisan Cafe", "RESTAURANT", "Bucharest", 5.0m, "RO", "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500&h=200&fit=crop", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "Specialty coffee and artisan pastries", true, false, 44.4650m, "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=100&h=100&fit=crop", 26.0580m, null, null, null, "020748", null, 0, new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), new Guid("55555555-5555-5555-5555-555555555555"), null },
                    { new Guid("ffffffff-ffff-ffff-ffff-ffffffffffff"), "Strada Regie, 8", null, 4.4m, "Taverna Athena", "RESTAURANT", "Bucharest", 5.0m, "RO", "https://images.unsplash.com/photo-1555939594-58d7cb561482?w=500&h=200&fit=crop", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "Traditional Greek cuisine and mezze plates", true, false, 44.4645m, "https://images.unsplash.com/photo-1555939594-58d7cb561482?w=100&h=100&fit=crop", 26.0595m, null, null, null, "020756", null, 0, new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), new Guid("66666666-6666-6666-6666-666666666666"), null }
                });

            migrationBuilder.InsertData(
                table: "Offers",
                columns: new[] { "OfferId", "AllergensJson", "Category", "CreatedAt", "Description", "Dietary", "DiscountPercentage", "DiscountedPrice", "ExpirationDate", "FoodName", "ImageUrl", "IsAvailable", "MerchantId", "OriginalPrice", "PickupEndTime", "PickupStartTime", "Quantity", "QuantityUnit", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111112"), null, "PREPARED_MEALS", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "Assorted fresh vegetables in light tempura batter", "VEGETARIAN", 50, 19.00m, new DateOnly(2026, 1, 15), "Vegetable Tempura", "https://images.unsplash.com/photo-1611680626919-8cf0cab20c51?w=300&h=200&fit=crop", true, new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), 38.00m, new DateTime(2026, 1, 14, 15, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 1, 14, 13, 0, 0, 0, DateTimeKind.Utc), 4, "PORTION", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("22222222-2222-2222-2222-222222222222"), null, "PREPARED_MEALS", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "Juicy beef patty with cheddar cheese, lettuce, tomato and special sauce", "NONE", 50, 24.00m, new DateOnly(2026, 1, 14), "Classic Cheeseburger", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop", true, new Guid("cccccccc-cccc-cccc-cccc-cccccccccccc"), 48.00m, new DateTime(2026, 1, 14, 14, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 1, 14, 13, 0, 0, 0, DateTimeKind.Utc), 5, "PIECE", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("33333333-3333-3333-3333-333333333333"), null, "PREPARED_MEALS", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "Plant-based burger with grilled vegetables and vegan mayo", "NONE", 50, 21.00m, new DateOnly(2026, 1, 15), "Veggie Burger", "https://images.unsplash.com/photo-1581887720020-91ec17a7a568?w=300&h=200&fit=crop", true, new Guid("cccccccc-cccc-cccc-cccc-cccccccccccc"), 42.00m, new DateTime(2026, 1, 14, 16, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 1, 14, 14, 0, 0, 0, DateTimeKind.Utc), 3, "PIECE", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("44444444-4444-4444-4444-444444444444"), null, "PREPARED_MEALS", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "Traditional Vietnamese beef pho with broth and rice noodles", "NONE", 50, 22.50m, new DateOnly(2026, 1, 14), "Beef Pho", "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop", true, new Guid("dddddddd-dddd-dddd-dddd-dddddddddddd"), 45.00m, new DateTime(2026, 1, 14, 14, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 1, 14, 13, 0, 0, 0, DateTimeKind.Utc), 4, "PORTION", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("55555555-5555-5555-5555-555555555555"), null, "PREPARED_MEALS", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "Fresh vegetarian pho with tofu and seasonal vegetables", "VEGETARIAN", 50, 20.00m, new DateOnly(2026, 1, 15), "Vegetarian Pho", "https://images.unsplash.com/photo-1588013273468-315fd88ea343?w=300&h=200&fit=crop", true, new Guid("dddddddd-dddd-dddd-dddd-dddddddddddd"), 40.00m, new DateTime(2026, 1, 14, 15, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 1, 14, 14, 0, 0, 0, DateTimeKind.Utc), 3, "PORTION", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("66666666-6666-6666-6666-666666666666"), null, "PREPARED_MEALS", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "Fresh butter croissant with premium espresso or cappuccino", "VEGETARIAN", 50, 16.00m, new DateOnly(2026, 1, 14), "Croissant & Coffee Bundle", "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=300&h=200&fit=crop", true, new Guid("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"), 32.00m, new DateTime(2026, 1, 14, 14, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 1, 14, 13, 0, 0, 0, DateTimeKind.Utc), 6, "PACK", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("77777777-7777-7777-7777-777777777777"), null, "PREPARED_MEALS", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "Delicate almond croissant with sliced almonds and powdered sugar", "VEGETARIAN", 50, 14.00m, new DateOnly(2026, 1, 14), "Almond Croissant", "https://images.unsplash.com/photo-1527521481379-d28b9fce3586?w=300&h=200&fit=crop", true, new Guid("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"), 28.00m, new DateTime(2026, 1, 14, 15, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 1, 14, 13, 0, 0, 0, DateTimeKind.Utc), 4, "PIECE", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("88888888-8888-8888-8888-888888888888"), null, "PREPARED_MEALS", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "Mix of tzatziki, hummus, feta, olives, bread and vegetables", "VEGETARIAN", 50, 35.00m, new DateOnly(2026, 1, 15), "Greek Mezze Platter", "https://images.unsplash.com/photo-1555939594-58d7cb561482?w=300&h=200&fit=crop", true, new Guid("ffffffff-ffff-ffff-ffff-ffffffffffff"), 70.00m, new DateTime(2026, 1, 14, 15, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 1, 14, 13, 0, 0, 0, DateTimeKind.Utc), 2, "PACK", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("99999999-9999-9999-9999-999999999999"), null, "PREPARED_MEALS", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "Tender lamb souvlaki with pita bread and lemon potato", "NONE", 50, 34.00m, new DateOnly(2026, 1, 15), "Grilled Lamb Souvlaki", "https://images.unsplash.com/photo-1599599810694-b3da7dd22d1d?w=300&h=200&fit=crop", true, new Guid("ffffffff-ffff-ffff-ffff-ffffffffffff"), 68.00m, new DateTime(2026, 1, 14, 16, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 1, 14, 14, 0, 0, 0, DateTimeKind.Utc), 2, "PACK", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("dddddddd-dddd-dddd-dddd-dddddddddddd"), null, "PREPARED_MEALS", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "Classic Margherita pizza with fresh mozzarella and basil", "VEGETARIAN", 50, 20.00m, new DateOnly(2026, 1, 15), "Margherita Pizza", "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=300&h=200&fit=crop", true, new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), 40.00m, new DateTime(2026, 1, 14, 15, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 1, 14, 13, 0, 0, 0, DateTimeKind.Utc), 3, "PIECE", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"), null, "PREPARED_MEALS", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "Four cheese pizza with ricotta, mozzarella, parmesan and gorgonzola", "VEGETARIAN", 50, 25.00m, new DateOnly(2026, 1, 15), "Quattro Formaggi", "https://images.unsplash.com/photo-1571407-918cfff43dfb?w=300&h=200&fit=crop", true, new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), 50.00m, new DateTime(2026, 1, 14, 16, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 1, 14, 14, 0, 0, 0, DateTimeKind.Utc), 2, "PIECE", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("ffffffff-ffff-ffff-ffff-ffffffffffff"), null, "PREPARED_MEALS", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc), "Fresh salmon, avocado, and cucumber sushi roll - 8 pieces", "NONE", 50, 30.00m, new DateOnly(2026, 1, 14), "Salmon Sushi Roll", "https://images.unsplash.com/photo-1553621042-f6e147245ba1?w=300&h=200&fit=crop", true, new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), 60.00m, new DateTime(2026, 1, 14, 14, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 1, 14, 13, 0, 0, 0, DateTimeKind.Utc), 2, "PACK", new DateTime(2026, 1, 14, 12, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Analytics_MerchantId_DateRecorded",
                table: "Analytics",
                columns: new[] { "MerchantId", "DateRecorded" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Favorites_MerchantId",
                table: "Favorites",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_Favorites_UserId_MerchantId",
                table: "Favorites",
                columns: new[] { "UserId", "MerchantId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Merchants_UserId",
                table: "Merchants",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Offers_MerchantId",
                table: "Offers",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_MerchantId",
                table: "Orders",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_OfferId",
                table: "Orders",
                column: "OfferId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_UserId",
                table: "Orders",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_MerchantId",
                table: "Reviews",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_OrderId",
                table: "Reviews",
                column: "OrderId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_UserId",
                table: "Reviews",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_MerchantId",
                table: "Transactions",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_OrderId",
                table: "Transactions",
                column: "OrderId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_UserId",
                table: "Transactions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Analytics");

            migrationBuilder.DropTable(
                name: "Favorites");

            migrationBuilder.DropTable(
                name: "Reviews");

            migrationBuilder.DropTable(
                name: "Transactions");

            migrationBuilder.DropTable(
                name: "Orders");

            migrationBuilder.DropTable(
                name: "Offers");

            migrationBuilder.DropTable(
                name: "Merchants");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
