namespace RestaurantHub.Api.DTOs;

public class ProductoPedidoDto
{
    public int ProductoId { get; set; }
    public int Cantidad { get; set; }

    public string? Observaciones { get; set; }

}