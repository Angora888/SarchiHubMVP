using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class ClientePorRestaurante : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Clientes_Telefono",
                table: "Clientes");

            migrationBuilder.AddColumn<int>(
                name: "RestaurantId",
                table: "Clientes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_RestaurantId_Telefono",
                table: "Clientes",
                columns: new[] { "RestaurantId", "Telefono" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Clientes_Restaurants_RestaurantId",
                table: "Clientes",
                column: "RestaurantId",
                principalTable: "Restaurants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Clientes_Restaurants_RestaurantId",
                table: "Clientes");

            migrationBuilder.DropIndex(
                name: "IX_Clientes_RestaurantId_Telefono",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "RestaurantId",
                table: "Clientes");

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_Telefono",
                table: "Clientes",
                column: "Telefono",
                unique: true);
        }
    }
}
