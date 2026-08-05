using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class CategoriaPorRstaurante : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RestaurantId",
                table: "Categoria",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateIndex(
                name: "IX_Categoria_RestaurantId",
                table: "Categoria",
                column: "RestaurantId");

            migrationBuilder.AddForeignKey(
                name: "FK_Categoria_Restaurants_RestaurantId",
                table: "Categoria",
                column: "RestaurantId",
                principalTable: "Restaurants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Categoria_Restaurants_RestaurantId",
                table: "Categoria");

            migrationBuilder.DropIndex(
                name: "IX_Categoria_RestaurantId",
                table: "Categoria");

            migrationBuilder.DropColumn(
                name: "RestaurantId",
                table: "Categoria");
        }
    }
}
