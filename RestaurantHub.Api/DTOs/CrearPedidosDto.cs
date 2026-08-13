namespace RestaurantHub.Api.DTOs;

public class CrearPedidoDto
{
    public int? MesaId { get; set; }
    public int? ClienteId { get; set; }

    public string TipoPedido { get; set; } = "";

    public List<CrearDetallePedidoDto> Productos { get; set; } = new();
}

public class CrearDetallePedidoDto
{
    public int ProductoId { get; set; }

    public int Cantidad { get; set; }

    public string? Observaciones { get; set; }

    public List<CrearExtraPedidoDto> Extras { get; set; } = new();
}

public class CrearExtraPedidoDto
{
    public int ProductoId { get; set; }

    public int Cantidad { get; set; } = 1;
}