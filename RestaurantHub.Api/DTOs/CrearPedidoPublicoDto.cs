namespace RestaurantHub.Api.DTOs;

public class CrearPedidoPublicoDto
{
    public string PublicId { get; set; } = "";
    public string Nombre { get; set; } = "";
    public string Telefono { get; set; } = "";
    public List<CrearDetallePedidoDto> Productos { get; set; } = new();
}