using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FrugalBites.Migrations
{
    /// <inheritdoc />
    public partial class UpdateUserPasswords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Update user passwords with proper BCrypt hashes
            migrationBuilder.Sql("UPDATE Users SET PasswordHash = '$2a$11$WktiLE3Tdov3If1pLNiqt.nZkeyIBOeeSGArxsvaZp26IP2MKdVou' WHERE Email = 'pizzaroma@restaurant.com'");
            migrationBuilder.Sql("UPDATE Users SET PasswordHash = '$2a$11$DtxQoFhgkxYYtPJuB.I4gONLTCDQm4ZxPCXpJtg4o7i74ZYaxiWqG' WHERE Email = 'sushi@restaurant.com'");
            migrationBuilder.Sql("UPDATE Users SET PasswordHash = '$2a$11$WktiLE3Tdov3If1pLNiqt.nZkeyIBOeeSGArxsvaZp26IP2MKdVou' WHERE Email = 'burgers@restaurant.com'");
            migrationBuilder.Sql("UPDATE Users SET PasswordHash = '$2a$11$WktiLE3Tdov3If1pLNiqt.nZkeyIBOeeSGArxsvaZp26IP2MKdVou' WHERE Email = 'vietnamese@restaurant.com'");
            migrationBuilder.Sql("UPDATE Users SET PasswordHash = '$2a$11$WktiLE3Tdov3If1pLNiqt.nZkeyIBOeeSGArxsvaZp26IP2MKdVou' WHERE Email = 'cafe@restaurant.com'");
            migrationBuilder.Sql("UPDATE Users SET PasswordHash = '$2a$11$WktiLE3Tdov3If1pLNiqt.nZkeyIBOeeSGArxsvaZp26IP2MKdVou' WHERE Email = 'greek@restaurant.com'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert to empty passwords (not recommended for production)
            migrationBuilder.Sql("UPDATE Users SET PasswordHash = '' WHERE UserType = 'MERCHANT'");
        }
    }
}
