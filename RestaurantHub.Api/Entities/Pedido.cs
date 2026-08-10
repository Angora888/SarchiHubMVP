using RestaurantHub.Core.Entities;

namespace RestaurantHub.Api.Models;

public class Pedido
{
    public int Id { get; set; }

    public DateTime Fecha { get; set; } = DateTime.Now;

    public string Estado { get; set; } = "Pendiente";

    public decimal Total { get; set; }

    // Restaurante al que pertenece el pedido
    public int RestaurantId { get; set; }
    public Restaurant? Restaurant { get; set; }

    // Mesa opcional
    public int? MesaId { get; set; }
    public Mesa? Mesa { get; set; }

    // Cliente opcional
    public int? ClienteId { get; set; }
    public Cliente? Cliente { get; set; }

    public string? CodigoQRPedido { get; set; }

    public int NumeroPedido { get; set; }

    public List<DetallePedido> Detalles { get; set; } = new();
}