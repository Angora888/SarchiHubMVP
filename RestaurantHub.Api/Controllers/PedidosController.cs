using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantHub.Api.Data;
using RestaurantHub.Api.DTOs;
using RestaurantHub.Api.Models;
using System.Security.Claims;
namespace RestaurantHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PedidosController : ControllerBase
{
    private readonly RestaurantHubContext _context;
    public PedidosController(RestaurantHubContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> CrearPedido(CrearPedidoDto dto)
    {
        await using var transaction =
       await _context.Database.BeginTransactionAsync();

        try {

            // 1. Verificar que la mesa exista
            var mesa = await _context.Mesa.FindAsync(dto.MesaId);
            if (mesa == null)
                return BadRequest("La mesa no existe.");
            if (mesa.Status == "Ocupada")
                return BadRequest("La mesa esta ocupada.");
            // 2. Crear el pedido
            var pedido = new Pedido
            {
                MesaId = dto.MesaId,
                Fecha = DateTime.UtcNow,
                Estado = "Pendiente",
                Total = 0
            };
            _context.Pedidos.Add(pedido);
            decimal total = 0;
            // 3. Recorrer todos los productos enviados
            if (dto.Productos == null || !dto.Productos.Any())
                return BadRequest("Debe agregar al menos un producto al pedido.");

            foreach (var item in dto.Productos)
            {
                var producto = await _context.Producto.FindAsync(item.ProductoId);
                if (producto == null)
                    return BadRequest($"Producto {item.ProductoId} no existe.");
                decimal subtotal = producto.Precio * item.Cantidad;
                total += subtotal;
                var detalle = new DetallePedido
                {
                    Pedido = pedido,
                    ProductoId = producto.Id,
                    Cantidad = item.Cantidad,
                    PrecioUnitario = producto.Precio,
                    Observaciones = item.Observaciones,
                    Subtotal = subtotal
                };
                Console.WriteLine(item.Observaciones);
                _context.DetallesPedido.Add(detalle);
            }
            // 4. Guardar el total
            pedido.Total = total;
            mesa.Status = "Ocupada";
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return Ok(new
            {
                pedidoId = pedido.Id,
                estado = pedido.Estado,
                total = pedido.Total
            });

        }
        catch (Exception ex) { 

            await transaction.RollbackAsync();
            return StatusCode(500, $"Error al crear el pedido: {ex.Message}");

        }


    }

    [HttpPost("{id}/cerrar")]
    public async Task<IActionResult> CerrarPedido(int id)
    {
        var pedido = await _context.Pedidos.FindAsync(id);
        if (pedido == null)
            return NotFound("Pedido no encontrado.");
        if (pedido.Estado == "Finalizado")
            return BadRequest("El pedido ya fue cerrado.");
        var mesa = await _context.Mesa.FindAsync(pedido.MesaId);
        if (mesa == null)
            return BadRequest("La mesa no existe.");
        pedido.Estado = "Finalizado";
        mesa.Status = "Disponible";
        await _context.SaveChangesAsync();
        return Ok(new
        {
            mensaje = "Pedido cerrado correctamente.",
            pedidoId = pedido.Id,
            mesa = mesa.Number
        });
    }

    [HttpPost("{id}/agregar-producto")]
    public async Task<IActionResult> AgregarProducto(int id, AgregarProductoDto dto)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var pedido = await _context.Pedidos.FindAsync(id);
            if (pedido == null)
                return NotFound("Pedido no encontrado.");
            if (pedido.Estado == "Finalizado")
                return BadRequest("El pedido ya fue finalizado.");
            if (dto.Cantidad <= 0)
                return BadRequest("La cantidad debe ser mayor que cero.");
            var producto = await _context.Producto.FindAsync(dto.ProductoId);
            if (producto == null)
                return BadRequest("El producto no existe.");
            if (!producto.Disponible)
                return BadRequest("El producto no está disponible.");
            // Buscar si el producto ya existe en el pedido
            var detalle = await _context.DetallesPedido
                .FirstOrDefaultAsync(d =>
                    d.PedidoId == pedido.Id &&
                    d.ProductoId == producto.Id);
            if (detalle != null)
            {
                // Ya existe, solo aumentamos la cantidad
                detalle.Cantidad += dto.Cantidad;
                detalle.Subtotal = detalle.Cantidad * detalle.PrecioUnitario;
            }
            else
            {
                // No existe, creamos una nueva línea
                detalle = new DetallePedido
                {
                    PedidoId = pedido.Id,
                    ProductoId = producto.Id,
                    Cantidad = dto.Cantidad,
                    PrecioUnitario = producto.Precio,
                    Observaciones = detalle.Observaciones,
                    Subtotal = producto.Precio * dto.Cantidad
                };
                _context.DetallesPedido.Add(detalle);
            }
            // Recalcular el total del pedido
            await _context.SaveChangesAsync();
            pedido.Total = await _context.DetallesPedido
                .Where(d => d.PedidoId == pedido.Id)
                .SumAsync(d => d.Subtotal);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return Ok(new
            {
                mensaje = "Producto agregado correctamente.",
                pedidoId = pedido.Id,
                nuevoTotal = pedido.Total
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPedido(int id)
    {
        var pedido = await _context.Pedidos
            .Include(p => p.Mesa)
            .ThenInclude(m => m.Restaurant)
            .Include(p => p.Detalles)
            .ThenInclude(d => d.Producto)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (pedido == null)
            return NotFound();
        return Ok(new
        {
            id = pedido.Id,
            restaurant = pedido.Mesa?.Restaurant?.Name,
            mesa = pedido.Mesa?.Number,
            estado = pedido.Estado,
            total = pedido.Total,
            fecha = pedido.Fecha,
            detalles = pedido.Detalles.Select(d => new
            {
                id = d.Id,
                producto = d.Producto?.Nombre,
                cantidad = d.Cantidad,
                precioUnitario = d.PrecioUnitario,
                subtotal = d.Subtotal,
                observaciones = d.Observaciones
            })
        });
    }

    [HttpGet("cocina")]
    public async Task<IActionResult> ObtenerPedidosCocina()
    {
        var restaurantId = ObtenerRestaurantId();
        var pedidos = await _context.Pedidos
            .Include(p => p.Mesa)
            .Include(p => p.Detalles)
            .ThenInclude(d => d.Producto)
            .Where(p =>
                p.Mesa!.RestaurantId == restaurantId &&
                p.Estado == "Pendiente" ||
                p.Estado == "Preparando")
            .OrderBy(p => p.Fecha)
            .ToListAsync();
        return Ok(
            pedidos.Select(p => new
            {
                id = p.Id,
                mesa = p.Mesa!.Number,
                estado = p.Estado,
                fecha = p.Fecha,
                total = p.Total,
                detalles = p.Detalles.Select(d => new
                {
                    producto = d.Producto!.Nombre,
                    cantidad = d.Cantidad,
                    observaciones = d.Observaciones
                })
            })
        );
    }

    [HttpPut("{id}/preparando")]
    public async Task<IActionResult> MarcarPreparando(int id)
    {
        var pedido = await _context.Pedidos.FindAsync(id);
        if (pedido == null)
            return NotFound("Pedido no encontrado.");
        if (pedido.Estado != "Pendiente")
            return BadRequest("Solo los pedidos pendientes pueden pasar a preparación.");
        pedido.Estado = "Preparando";
        await _context.SaveChangesAsync();
        return Ok(new
        {
            mensaje = "Pedido en preparación.",
            estado = pedido.Estado
        });
    }

    [HttpPut("{id}/listo")]
    public async Task<IActionResult> MarcarListo(int id)
    {
        var pedido = await _context.Pedidos.FindAsync(id);
        if (pedido == null)
            return NotFound("Pedido no encontrado.");
        if (pedido.Estado != "Preparando")
            return BadRequest("El pedido debe estar en preparación.");
        pedido.Estado = "Listo";
        await _context.SaveChangesAsync();
        return Ok(new
        {
            mensaje = "Pedido listo para entregar.",
            estado = pedido.Estado
        });
    }

    [HttpPut("{id}/terminar")]
    public async Task<IActionResult> TerminarPedido(int id)
    {
        var pedido = await _context.Pedidos.FindAsync(id);
        if (pedido == null)
            return NotFound("Pedido no encontrado.");
        if (pedido.Estado != "Listo")
            return BadRequest("Solo se pueden terminar pedidos listos.");
        var mesa = await _context.Mesa.FindAsync(pedido.MesaId);
        if (mesa == null)
            return BadRequest("La mesa no existe.");
        pedido.Estado = "Terminado";
        mesa.Status = "Disponible";
        await _context.SaveChangesAsync();
        return Ok(new
        {
            mensaje = "Pedido terminado correctamente."
        });
    }

    [HttpGet("caja")]
    public async Task<IActionResult> ObtenerPedidosCaja()
    {
        var restaurantId = ObtenerRestaurantId();
        var pedidos = await _context.Pedidos
            .Include(p => p.Mesa)
            .Include(p => p.Detalles)
                .ThenInclude(d => d.Producto)
            .Where(p => p.Estado == "Listo" && p.Mesa!.RestaurantId == restaurantId)
            .OrderBy(p => p.Fecha)
            .Select(p => new
            {
                p.Id,
                Mesa = p.Mesa.Number,
                p.Total,
                p.Fecha,
                Detalles = p.Detalles.Select(d => new
                {
                    Producto = d.Producto.Nombre,
                    d.Cantidad,
                    d.Observaciones
                })
            })
            .ToListAsync();
        return Ok(pedidos);
    }

    private int ObtenerRestaurantId()
    {
        return int.Parse(
            User.FindFirst("RestaurantId")!.Value
        );
    }
}