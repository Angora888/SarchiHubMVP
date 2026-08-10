using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantHub.Api.Data;
using RestaurantHub.Api.DTOs;
using RestaurantHub.Api.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using static RestaurantHub.Api.Controllers.DashboardController;
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
        try
        {
            if (dto.Productos == null || !dto.Productos.Any())
                return BadRequest("Debe agregar al menos un producto al pedido.");
            Mesa? mesa = null;
            int restaurantId;
            // 🪑 PEDIDO DESDE MESA
            if (dto.MesaId.HasValue)
            {
                mesa = await _context.Mesa
                    .FirstOrDefaultAsync(m => m.Id == dto.MesaId.Value);
                if (mesa == null)
                    return BadRequest("La mesa no existe.");
                if (mesa.Status == "Ocupada")
                    return BadRequest("La mesa está ocupada.");
                restaurantId = mesa.RestaurantId;
            }
            // 📞 PEDIDO XPRESS
            else
            {
                // Para Xpress obtenemos el restaurante
                // del usuario que está creando el pedido.
                restaurantId = ObtenerRestaurantId();
                if (!dto.ClienteId.HasValue)
                    return BadRequest("El pedido Xpress requiere un cliente.");
            }
            // 🔢 Número consecutivo por restaurante
            var ultimoNumero = await _context.Pedidos
                .Where(p => p.RestaurantId == restaurantId)
                .MaxAsync(p => (int?)p.NumeroPedido) ?? 0;
            var pedido = new Pedido
            {
                RestaurantId = restaurantId,
                MesaId = dto.MesaId,
                ClienteId = dto.ClienteId,
                Fecha = DateTime.UtcNow,
                Estado = "Pendiente",
                Total = 0,
                NumeroPedido = ultimoNumero + 1,
                CodigoQRPedido = Guid.NewGuid().ToString()
            };
            _context.Pedidos.Add(pedido);
            decimal total = 0;
            // 🛒 Productos
            foreach (var item in dto.Productos)
            {
                var producto = await _context.Producto
                    .FirstOrDefaultAsync(p =>
                        p.Id == item.ProductoId &&
                        p.RestaurantId == restaurantId);
                if (producto == null)
                    return BadRequest(
                        $"El producto {item.ProductoId} no existe para este restaurante."
                    );
                if (item.Cantidad <= 0)
                    return BadRequest(
                        "La cantidad de productos debe ser mayor que cero."
                    );
                decimal subtotal =
                    producto.Precio * item.Cantidad;
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
                _context.DetallesPedido.Add(detalle);
            }
            pedido.Total = total;
            // 🪑 Solo ocupamos la mesa si existe
            if (mesa != null)
            {
                mesa.Status = "Ocupada";
            }
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return Ok(new
            {
                pedido = pedido.Id,
                estado = pedido.Estado,
                pedidoQR = pedido.CodigoQRPedido,
                numeroPedido = pedido.NumeroPedido,
                total = pedido.Total
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(
                500,
                $"Error al crear el pedido: {ex.Message}"
            );
        }
    }

    [HttpPost("{id}/cerrar")]
    [Authorize]
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
    [Authorize]
    public async Task<IActionResult> AgregarProducto(
        int id,
        AgregarProductoDto dto)
    {
        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            var restaurantId = ObtenerRestaurantId();
            var esAdmin = User.IsInRole("Admin");

            var query = _context.Pedidos
                .Where(p => p.Id == id);

            // Cliente solamente puede modificar pedidos de su restaurante
            if (!esAdmin)
            {
                query = query.Where(
                    p => p.RestaurantId == restaurantId
                );
            }

            var pedido = await query.FirstOrDefaultAsync();

            if (pedido == null)
                return NotFound("Pedido no encontrado.");

            // Ya terminado no se puede tocar
            if (pedido.Estado == "Terminado")
            {
                return BadRequest(
                    "No se pueden agregar productos a un pedido terminado."
                );
            }

            if (dto.Cantidad <= 0)
            {
                return BadRequest(
                    "La cantidad debe ser mayor que cero."
                );
            }

            // Importantísimo:
            // el producto tiene que pertenecer al mismo restaurante del pedido.
            var producto = await _context.Producto
                .FirstOrDefaultAsync(p =>
                    p.Id == dto.ProductoId &&
                    p.RestaurantId == pedido.RestaurantId);

            if (producto == null)
            {
                return BadRequest(
                    "El producto no existe o no pertenece a este restaurante."
                );
            }

            if (!producto.Disponible)
            {
                return BadRequest(
                    "El producto no está disponible."
                );
            }

            var detalle = await _context.DetallesPedido
                .FirstOrDefaultAsync(d =>
                    d.PedidoId == pedido.Id &&
                    d.ProductoId == producto.Id);

            if (detalle != null)
            {
                // Ya estaba en el pedido
                detalle.Cantidad += dto.Cantidad;

                detalle.Subtotal =
                    detalle.Cantidad *
                    detalle.PrecioUnitario;

                // Si escribieron una nueva observación,
                // la actualizamos
                if (!string.IsNullOrWhiteSpace(dto.Observaciones))
                {
                    detalle.Observaciones =
                        dto.Observaciones;
                }
            }
            else
            {
                // Producto nuevo dentro del pedido
                detalle = new DetallePedido
                {
                    PedidoId = pedido.Id,
                    ProductoId = producto.Id,
                    Cantidad = dto.Cantidad,
                    PrecioUnitario = producto.Precio,
                    Observaciones = dto.Observaciones,
                    Subtotal =
                        producto.Precio *
                        dto.Cantidad
                };

                _context.DetallesPedido.Add(detalle);
            }

            await _context.SaveChangesAsync();

            // Recalcular total completo del pedido
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

    [HttpGet]
    public async Task<IActionResult> ObtenerPedidos()
    {
        var restaurantId = ObtenerRestaurantId();
        var esAdmin = User.IsInRole("Admin");

        var (inicio, fin) = FechaHelper.ObtenerRangoHoyCostaRica();

        var query = _context.Pedidos
            .Include(p => p.Mesa)
            .Include(p => p.Cliente)
            .Include(p => p.Detalles)
            .AsQueryable();

        if (!esAdmin)
        {
            query = query.Where(p => p.RestaurantId == restaurantId);
        }

        var pedidos = await query
            .Where(p =>
                p.Fecha >= inicio &&
                p.Fecha < fin)
            .OrderByDescending(p => p.Fecha)
            .Select(p => new
            {
                id = p.Id,

                mesa = p.Mesa != null
                    ? p.Mesa.Number
                    : (int?)null,

                cliente = p.Cliente == null
                    ? null
                    : new
                    {
                        id = p.Cliente.Id,
                        nombre = p.Cliente.NombreCompleto,
                        telefono = p.Cliente.Telefono,
                        direccion = p.Cliente.Direccion
                    },

                estado = p.Estado,
                total = p.Total,
                fecha = p.Fecha,
                codigoQR = p.CodigoQRPedido,
                numeroPedido = p.NumeroPedido,

                cantidadProductos = p.Detalles.Sum(d => d.Cantidad)
            })
            .ToListAsync();

        return Ok(pedidos);
    }


    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPedido(string id)
    {
        var pedido = await _context.Pedidos
            .Include(p => p.Restaurant)
            .Include(p => p.Mesa)
            .Include(p => p.Cliente)
            .Include(p => p.Detalles)
            .ThenInclude(d => d.Producto)
            .FirstOrDefaultAsync(p => p.CodigoQRPedido == id);
        if (pedido == null)
            return NotFound();
        return Ok(new
        {
            id = pedido.Id,
            restaurant = pedido.Restaurant?.Name,
            mesa = pedido.Mesa?.Number,
            cliente = pedido.Cliente == null
                ? null
                : new
                {
                    id = pedido.Cliente.Id,
                    nombre = pedido.Cliente.NombreCompleto,
                    telefono = pedido.Cliente.Telefono,
                    direccion = pedido.Cliente.Direccion
                },
            estado = pedido.Estado,
            total = pedido.Total,
            numeroPedido = pedido.NumeroPedido,
            fecha = pedido.Fecha,
            codigoQR = pedido.CodigoQRPedido,
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
    [Authorize]
    public async Task<IActionResult> ObtenerPedidosCocina()
    {
        var restaurantId = ObtenerRestaurantId();
        var esAdmin = User.IsInRole("Admin");
        var query = _context.Pedidos
            .Include(p => p.Mesa)
            .Include(p => p.Cliente)
            .Include(p => p.Detalles)
                .ThenInclude(d => d.Producto)
            .AsQueryable();
        if (!esAdmin)
        {
            query = query.Where(p => p.RestaurantId == restaurantId);
        }
        var pedidos = await query
            .Where(p =>
                p.Estado == "Pendiente" ||
                p.Estado == "Preparando")
            .OrderBy(p => p.Fecha)
            .ToListAsync();
        return Ok(
            pedidos.Select(p => new
            {
                id = p.Id,
                mesa = p.Mesa?.Number,
                cliente = p.Cliente == null
                    ? null
                    : new
                    {
                        nombre = p.Cliente.NombreCompleto,
                        telefono = p.Cliente.Telefono,
                        direccion = p.Cliente.Direccion
                    },
                estado = p.Estado,
                fecha = p.Fecha,
                total = p.Total,
                numeroPedido = p.NumeroPedido,
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
    [Authorize]
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
    [Authorize]
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
    [Authorize]
    public async Task<IActionResult> TerminarPedido(int id)
    {
        var pedido = await _context.Pedidos
            .Include(p => p.Mesa)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (pedido == null)
            return NotFound("Pedido no encontrado.");
        if (pedido.Estado != "Listo")
            return BadRequest("Solo se pueden terminar pedidos listos.");
        pedido.Estado = "Terminado";
        // Solo liberar mesa si el pedido viene de una mesa
        if (pedido.Mesa != null)
        {
            pedido.Mesa.Status = "Disponible";
        }
        await _context.SaveChangesAsync();
        return Ok(new
        {
            mensaje = "Pedido terminado correctamente."
        });
    }

    [HttpGet("caja")]
    [Authorize]
    public async Task<IActionResult> ObtenerPedidosCaja()
    {
        var restaurantId = ObtenerRestaurantId();
        var esAdmin = User.IsInRole("Admin");
        var query = _context.Pedidos
            .Include(p => p.Mesa)
            .Include(p => p.Cliente)
            .Include(p => p.Detalles)
                .ThenInclude(d => d.Producto)
            .AsQueryable();
        if (!esAdmin)
        {
            query = query.Where(p => p.RestaurantId == restaurantId);
        }
        var pedidos = await query
            .Where(p => p.Estado == "Listo")
            .OrderBy(p => p.Fecha)
            .Select(p => new
            {
                p.Id,
                Mesa = p.Mesa != null
                    ? p.Mesa.Number
                    : (int?)null,
                Cliente = p.Cliente == null
                    ? null
                    : new
                    {
                        nombre = p.Cliente.NombreCompleto,
                        telefono = p.Cliente.Telefono,
                        direccion = p.Cliente.Direccion
                    },
                p.Total,
                numeroPedido = p.NumeroPedido,
                p.Fecha,
                Detalles = p.Detalles.Select(d => new
                {
                    Producto = d.Producto!.Nombre,
                    d.Cantidad,
                    d.Observaciones
                })
            })
            .ToListAsync();
        return Ok(pedidos);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> EliminarPedido(int id)
    {
        var restaurantId = ObtenerRestaurantId();
        var pedido = await _context.Pedidos
            .Include(p => p.Detalles)
            .Include(p => p.Mesa)
            .FirstOrDefaultAsync(p =>
                p.Id == id &&
                p.RestaurantId == restaurantId);
        if (pedido == null)
            return NotFound();
        // Si el pedido tiene mesa, la liberamos
        if (pedido.Mesa != null)
        {
            pedido.Mesa.Status = "Disponible";
        }
        _context.Pedidos.Remove(pedido);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("cierre-caja")]
    [Authorize]
    public async Task<IActionResult> ObtenerCierreCaja()
    {
        var restaurantId = ObtenerRestaurantId();
        var (inicio, fin) = FechaHelper.ObtenerRangoHoyCostaRica();

        var pedidos = await _context.Pedidos
            .Where(p =>
                p.RestaurantId == restaurantId &&
                p.Fecha >= inicio &&
                p.Fecha < fin &&
                p.Estado == "Terminado")
            .ToListAsync();

        var cantidadPedidos = pedidos.Count;
        var totalVentas = pedidos.Sum(p => p.Total);

        var pedidosMesa = pedidos
            .Where(p => p.MesaId != null)
            .ToList();

        var pedidosXpress = pedidos
            .Where(p => p.MesaId == null)
            .ToList();

        return Ok(new
        {
            cantidadPedidos,

            totalVentas,

            ticketPromedio = cantidadPedidos > 0
                ? totalVentas / cantidadPedidos
                : 0,

            mesa = new
            {
                cantidad = pedidosMesa.Count,
                total = pedidosMesa.Sum(p => p.Total)
            },

            xpress = new
            {
                cantidad = pedidosXpress.Count,
                total = pedidosXpress.Sum(p => p.Total)
            }
        });
    }

    private int ObtenerRestaurantId()
    {
        Console.WriteLine("===== CLAIMS DEL USUARIO =====");
        foreach (var claim in User.Claims)
        {
            Console.WriteLine($"{claim.Type} = {claim.Value}");
        }
        Console.WriteLine("==============================");
        if (!User.Identity?.IsAuthenticated ?? true)
        {
            throw new UnauthorizedAccessException("El usuario no está autenticado.");
        }
        var claimRestaurant = User.FindFirst("RestaurantId");
        if (claimRestaurant == null)
        {
            throw new UnauthorizedAccessException(
                "El token no contiene el claim RestaurantId.");
        }
        if (!int.TryParse(claimRestaurant.Value, out var restaurantId))
        {
            throw new Exception(
                $"RestaurantId inválido: {claimRestaurant.Value}");
        }
        return restaurantId;
    }
}