using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarRestauranteYClienteAPedido : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pedidos_Mesa_MesaId",
                table: "Pedidos");

            migrationBuilder.AlterColumn<int>(
                name: "MesaId",
                table: "Pedidos",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "ClienteId",
                table: "Pedidos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RestaurantId",
                table: "Pedidos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_ClienteId",
                table: "Pedidos",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_RestaurantId",
                table: "Pedidos",
                column: "RestaurantId");

            migrationBuilder.AddForeignKey(
                name: "FK_Pedidos_Clientes_ClienteId",
                table: "Pedidos",
                column: "ClienteId",
                principalTable: "Clientes",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Pedidos_Mesa_MesaId",
                table: "Pedidos",
                column: "MesaId",
                principalTable: "Mesa",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Pedidos_Restaurants_RestaurantId",
                table: "Pedidos",
                column: "RestaurantId",
                principalTable: "Restaurants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pedidos_Clientes_ClienteId",
                table: "Pedidos");

            migrationBuilder.DropForeignKey(
                name: "FK_Pedidos_Mesa_MesaId",
                table: "Pedidos");

            migrationBuilder.DropForeignKey(
                name: "FK_Pedidos_Restaurants_RestaurantId",
                table: "Pedidos");

            migrationBuilder.DropIndex(
                name: "IX_Pedidos_ClienteId",
                table: "Pedidos");

            migrationBuilder.DropIndex(
                name: "IX_Pedidos_RestaurantId",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "ClienteId",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "RestaurantId",
                table: "Pedidos");

            migrationBuilder.AlterColumn<int>(
                name: "MesaId",
                table: "Pedidos",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Pedidos_Mesa_MesaId",
                table: "Pedidos",
                column: "MesaId",
                principalTable: "Mesa",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
