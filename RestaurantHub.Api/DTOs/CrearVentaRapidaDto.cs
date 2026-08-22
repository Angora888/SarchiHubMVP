namespace RestaurantHub.Api.DTOs;

public class CrearVentaRapidaDto
{
    public List<CrearDetallePedidoDto> Productos { get; set; } = new();
}