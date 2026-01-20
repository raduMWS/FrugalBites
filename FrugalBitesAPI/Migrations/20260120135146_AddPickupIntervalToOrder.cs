using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FrugalBites.Migrations
{
    /// <inheritdoc />
    public partial class AddPickupIntervalToOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "PickupEndTime",
                table: "Orders",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PickupStartTime",
                table: "Orders",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PickupEndTime",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PickupStartTime",
                table: "Orders");
        }
    }
}
