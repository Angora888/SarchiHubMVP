using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddObservacionesDetallePedidoV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Observaciones",
                table: "DetallesPedido",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Observaciones",
                table: "DetallesPedido");
        }
    }
}
