using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarPublicIdYPedidosOnline : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "PermitirPedidosOnline",
                table: "Restaurants",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "PublicId",
                table: "Restaurants",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PermitirPedidosOnline",
                table: "Restaurants");

            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "Restaurants");
        }
    }
}
