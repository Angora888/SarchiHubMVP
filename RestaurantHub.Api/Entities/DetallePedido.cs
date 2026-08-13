namespace RestaurantHub.Api.Models;

public class DetallePedido
{
    public int Id { get; set; }
    public int PedidoId { get; set; }
    public Pedido? Pedido { get; set; }
    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
    public string? Observaciones { get; set; }

    // Si este detalle es un extra, indica a cuál producto del pedido pertenece
    public int? DetallePadreId { get; set; }

    public DetallePedido? DetallePadre { get; set; }

    // Extras asociados a este producto
    public List<DetallePedido> Extras { get; set; } = new();
}