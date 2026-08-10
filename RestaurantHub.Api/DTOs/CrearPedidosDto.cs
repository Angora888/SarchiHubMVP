namespace RestaurantHub.Api.DTOs;

public class CrearPedidoDto
{
    public int? MesaId { get; set; }

    public int? ClienteId { get; set; }
    public List<ProductoPedidoDto> Productos { get; set; } = new();
}