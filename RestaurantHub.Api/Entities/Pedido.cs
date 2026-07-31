namespace RestaurantHub.Api.Models;

public class Pedido
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; } = DateTime.Now;
    public string Estado { get; set; } = "Pendiente";
    public decimal Total { get; set; }
    public int MesaId { get; set; }
    public Mesa? Mesa { get; set; }
    public List<DetallePedido> Detalles { get; set; } = new();
}