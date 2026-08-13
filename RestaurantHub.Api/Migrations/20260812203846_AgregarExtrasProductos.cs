using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarExtrasProductos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Producto_Categoria_CategoriaId",
                table: "Producto");

            migrationBuilder.AddColumn<int>(
                name: "CategoriaExtrasId",
                table: "Producto",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DetallePadreId",
                table: "DetallesPedido",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Producto_CategoriaExtrasId",
                table: "Producto",
                column: "CategoriaExtrasId");

            migrationBuilder.CreateIndex(
                name: "IX_DetallesPedido_DetallePadreId",
                table: "DetallesPedido",
                column: "DetallePadreId");

            migrationBuilder.AddForeignKey(
                name: "FK_DetallesPedido_DetallesPedido_DetallePadreId",
                table: "DetallesPedido",
                column: "DetallePadreId",
                principalTable: "DetallesPedido",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Producto_Categoria_CategoriaExtrasId",
                table: "Producto",
                column: "CategoriaExtrasId",
                principalTable: "Categoria",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Producto_Categoria_CategoriaId",
                table: "Producto",
                column: "CategoriaId",
                principalTable: "Categoria",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DetallesPedido_DetallesPedido_DetallePadreId",
                table: "DetallesPedido");

            migrationBuilder.DropForeignKey(
                name: "FK_Producto_Categoria_CategoriaExtrasId",
                table: "Producto");

            migrationBuilder.DropForeignKey(
                name: "FK_Producto_Categoria_CategoriaId",
                table: "Producto");

            migrationBuilder.DropIndex(
                name: "IX_Producto_CategoriaExtrasId",
                table: "Producto");

            migrationBuilder.DropIndex(
                name: "IX_DetallesPedido_DetallePadreId",
                table: "DetallesPedido");

            migrationBuilder.DropColumn(
                name: "CategoriaExtrasId",
                table: "Producto");

            migrationBuilder.DropColumn(
                name: "DetallePadreId",
                table: "DetallesPedido");

            migrationBuilder.AddForeignKey(
                name: "FK_Producto_Categoria_CategoriaId",
                table: "Producto",
                column: "CategoriaId",
                principalTable: "Categoria",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
