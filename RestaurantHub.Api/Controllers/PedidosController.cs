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
            {
                return BadRequest(
                    "Debe agregar al menos un producto al pedido.");
            }

            // =====================================================
            // TIPO DE PEDIDO
            // =====================================================

            // Compatibilidad temporal:
            // si todavía algún frontend no manda TipoPedido,
            // lo deducimos con la lógica anterior.
            var tipoPedido = string.IsNullOrWhiteSpace(dto.TipoPedido)
                ? (dto.MesaId.HasValue ? "Mesa" : "Xpress")
                : dto.TipoPedido.Trim();

            // Normalizar para evitar problemas de mayúsculas/minúsculas
            if (tipoPedido.Equals(
                "Mesa",
                StringComparison.OrdinalIgnoreCase))
            {
                tipoPedido = "Mesa";
            }
            else if (tipoPedido.Equals(
                "Xpress",
                StringComparison.OrdinalIgnoreCase))
            {
                tipoPedido = "Xpress";
            }
            else if (tipoPedido.Equals(
                "Llevar",
                StringComparison.OrdinalIgnoreCase))
            {
                tipoPedido = "Llevar";
            }
            else
            {
                return BadRequest(
                    "TipoPedido inválido. Debe ser Mesa, Xpress o Llevar.");
            }

            Mesa? mesa = null;
            int restaurantId;

            // =====================================================
            // 🪑 PEDIDO DE MESA
            // =====================================================

            if (tipoPedido == "Mesa")
            {
                if (!dto.MesaId.HasValue)
                {
                    return BadRequest(
                        "El pedido de mesa requiere una MesaId.");
                }

                mesa = await _context.Mesa
                    .FirstOrDefaultAsync(m =>
                        m.Id == dto.MesaId.Value);

                if (mesa == null)
                {
                    return BadRequest(
                        "La mesa no existe.");
                }

                if (mesa.Status == "Ocupada")
                {
                    return BadRequest(
                        "La mesa está ocupada.");
                }

                restaurantId =
                    mesa.RestaurantId;

                // Un pedido de mesa no necesita cliente
                dto.ClienteId = null;
            }

            // =====================================================
            // 🛵 XPRESS / 🥡 LLEVAR
            // =====================================================

            else
            {
                restaurantId =
                    ObtenerRestaurantId();

                if (dto.MesaId.HasValue)
                {
                    return BadRequest(
                        $"Un pedido tipo {tipoPedido} no puede tener una mesa asociada.");
                }

                if (!dto.ClienteId.HasValue)
                {
                    return BadRequest(
                        tipoPedido == "Xpress"
                            ? "El pedido Xpress requiere un cliente."
                            : "El pedido para llevar requiere un cliente.");
                }

                // Seguridad:
                // el cliente debe pertenecer al restaurante
                // del usuario autenticado.
                var clienteExiste =
                    await _context.Clientes
                        .AnyAsync(c =>
                            c.Id ==
                                dto.ClienteId.Value &&
                            c.RestaurantId ==
                                restaurantId);

                if (!clienteExiste)
                {
                    return BadRequest(
                        "El cliente no pertenece a este restaurante.");
                }
            }

            // =====================================================
            // 🔢 NÚMERO CONSECUTIVO
            // =====================================================

            var (inicio, fin) =
                FechaHelper.ObtenerRangoHoyCostaRica();

            var ultimoNumero = await _context.Pedidos
                .Where(p =>
                    p.RestaurantId == restaurantId &&
                    p.Fecha >= inicio &&
                    p.Fecha < fin)
                .MaxAsync(p =>
                    (int?)p.NumeroPedido) ?? 0;

            // =====================================================
            // CREAR PEDIDO
            // =====================================================

            var pedido = new Pedido
            {
                RestaurantId =
                    restaurantId,

                MesaId =
                    tipoPedido == "Mesa"
                        ? dto.MesaId
                        : null,

                ClienteId =
                    tipoPedido == "Mesa"
                        ? null
                        : dto.ClienteId,

                TipoPedido =
                    tipoPedido,

                Fecha =
                    DateTime.UtcNow,

                Estado =
                    "Pendiente",

                Total =
                    0,

                NumeroPedido =
                    ultimoNumero + 1,

                CodigoQRPedido =
                    Guid.NewGuid().ToString()
            };

            _context.Pedidos.Add(
                pedido);

            decimal total = 0;

            // =====================================================
            // 🛒 PRODUCTOS
            // =====================================================

            foreach (var item in dto.Productos)
            {
                var producto =
                    await _context.Producto
                        .FirstOrDefaultAsync(p =>
                            p.Id ==
                                item.ProductoId &&
                            p.RestaurantId ==
                                restaurantId);

                if (producto == null)
                {
                    return BadRequest(
                        $"El producto {item.ProductoId} no existe para este restaurante.");
                }

                // Producto deshabilitado
                if (!producto.Disponible)
                {
                    return BadRequest(
                        $"El producto {producto.Nombre} no está disponible.");
                }

                if (item.Cantidad <= 0)
                {
                    return BadRequest(
                        "La cantidad de productos debe ser mayor que cero.");
                }

                decimal subtotal =
                    producto.Precio *
                    item.Cantidad;

                total += subtotal;

                // =================================================
                // PRODUCTO PRINCIPAL
                // =================================================

                var detallePrincipal =
                    new DetallePedido
                    {
                        Pedido =
                            pedido,

                        ProductoId =
                            producto.Id,

                        Cantidad =
                            item.Cantidad,

                        PrecioUnitario =
                            producto.Precio,

                        Observaciones =
                            item.Observaciones,

                        Subtotal =
                            subtotal
                    };

                _context.DetallesPedido.Add(
                    detallePrincipal);

                // =================================================
                // ➕ EXTRAS
                // =================================================

                if (item.Extras != null &&
                    item.Extras.Any())
                {
                    // Si llegan extras, el producto
                    // debe tener una categoría configurada.
                    if (!producto.CategoriaExtrasId.HasValue)
                    {
                        return BadRequest(
                            $"El producto {producto.Nombre} no permite extras.");
                    }

                    foreach (
                        var extraDto in item.Extras)
                    {
                        var extra =
                            await _context.Producto
                                .FirstOrDefaultAsync(p =>
                                    p.Id ==
                                        extraDto.ProductoId &&
                                    p.RestaurantId ==
                                        restaurantId);

                        if (extra == null)
                        {
                            return BadRequest(
                                $"El extra {extraDto.ProductoId} no existe para este restaurante.");
                        }

                        if (!extra.Disponible)
                        {
                            return BadRequest(
                                $"El extra {extra.Nombre} no está disponible.");
                        }

                        // El extra realmente debe pertenecer
                        // a la categoría de extras configurada
                        // para este producto.
                        if (extra.CategoriaId !=
                            producto.CategoriaExtrasId.Value)
                        {
                            return BadRequest(
                                $"El producto {extra.Nombre} no es un extra válido para {producto.Nombre}.");
                        }

                        var cantidadExtra =
                            extraDto.Cantidad <= 0
                                ? 1
                                : extraDto.Cantidad;

                        decimal subtotalExtra =
                            extra.Precio *
                            cantidadExtra;

                        total +=
                            subtotalExtra;

                        var detalleExtra =
                            new DetallePedido
                            {
                                Pedido =
                                    pedido,

                                ProductoId =
                                    extra.Id,

                                Cantidad =
                                    cantidadExtra,

                                PrecioUnitario =
                                    extra.Precio,

                                Subtotal =
                                    subtotalExtra,

                                // Extra perteneciente
                                // a ESTA unidad/producto
                                DetallePadre =
                                    detallePrincipal
                            };

                        _context.DetallesPedido.Add(
                            detalleExtra);
                    }
                }
            }

            // =====================================================
            // TOTAL
            // =====================================================

            pedido.Total =
                total;

            // Solo pedidos de Mesa ocupan una mesa
            if (tipoPedido == "Mesa" &&
                mesa != null)
            {
                mesa.Status =
                    "Ocupada";
            }

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return Ok(new
            {
                pedido =
                    pedido.Id,

                tipoPedido =
                    pedido.TipoPedido,

                estado =
                    pedido.Estado,

                pedidoQR =
                    pedido.CodigoQRPedido,

                numeroPedido =
                    pedido.NumeroPedido,

                total =
                    pedido.Total
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();

            return StatusCode(
                500,
                $"Error al crear el pedido: {ex.Message}");
        }
    }

    [HttpPost("publico")]
    [AllowAnonymous]
    public async Task<IActionResult> CrearPedidoPublico(
       CrearPedidoPublicoDto dto)
    {
        await using var transaction =
            await _context.Database.BeginTransactionAsync();
        try
        {
            // =========================
            // VALIDACIONES
            // =========================
            if (string.IsNullOrWhiteSpace(dto.PublicId))
            {
                return BadRequest(
                    "Restaurante inválido."
                );
            }
            if (string.IsNullOrWhiteSpace(dto.Nombre))
            {
                return BadRequest(
                    "El nombre es obligatorio."
                );
            }
            if (string.IsNullOrWhiteSpace(dto.Telefono))
            {
                return BadRequest(
                    "El teléfono es obligatorio."
                );
            }
            var telefono =
                new string(
                    dto.Telefono
                        .Where(char.IsDigit)
                        .ToArray()
                );
            if (telefono.Length != 8)
            {
                return BadRequest(
                    "El teléfono debe tener 8 dígitos."
                );
            }
            if (
                dto.Productos == null ||
                !dto.Productos.Any()
            )
            {
                return BadRequest(
                    "Debe agregar al menos un producto."
                );
            }
            // =========================
            // RESTAURANTE
            // =========================

            var publicId = dto.PublicId
                .Trim()
                .ToLowerInvariant();

            var restaurant =
                await _context.Restaurants
                    .FirstOrDefaultAsync(r =>
                        r.PublicId == publicId &&
                        r.Active);

            if (restaurant == null)
            {
                return NotFound(
                    "Restaurante no encontrado."
                );
            }

            // El restaurante existe, pero decidió
            // pausar temporalmente pedidos online.
            if (!restaurant.PermitirPedidosOnline)
            {
                return Conflict(
                    "El restaurante no está recibiendo pedidos en línea en este momento."
                );
            }

            // Desde este punto trabajamos únicamente
            // con el Id interno del restaurante.
            var restaurantId = restaurant.Id;
            // =========================
            // CLIENTE
            // =========================
            var cliente =
                await _context.Clientes
                    .FirstOrDefaultAsync(c =>
                        c.RestaurantId ==
                            restaurantId &&
                        c.Telefono ==
                            telefono
                    );
            if (cliente == null)
            {
                cliente = new Cliente
                {
                    RestaurantId =
                        restaurantId,
                    Telefono =
                        telefono,
                    NombreCompleto =
                        dto.Nombre.Trim(),
                    Direccion =
                        "",
                    FechaRegistro =
                        DateTime.UtcNow
                };
                _context.Clientes.Add(
                    cliente
                );
            }
            else
            {
                /*
                 * El cliente pudo escribir
                 * un nombre diferente.
                 */
                cliente.NombreCompleto =
                    dto.Nombre.Trim();
            }
            // =========================
            // NÚMERO DEL PEDIDO
            // =========================
            var (inicio, fin) =
                FechaHelper
                    .ObtenerRangoHoyCostaRica();
            var ultimoNumero =
                await _context.Pedidos
                    .Where(p =>
                        p.RestaurantId ==
                            restaurantId &&
                        p.Fecha >= inicio &&
                        p.Fecha < fin
                    )
                    .MaxAsync(p =>
                        (int?)p.NumeroPedido
                    ) ?? 0;
            // =========================
            // CREAR PEDIDO
            // =========================
            var pedido =
                new Pedido
                {
                    RestaurantId =
                        restaurantId,
                    MesaId =
                        null,
                    Cliente =
                        cliente,
                    TipoPedido =
                        "Llevar",
                    Fecha =
                        DateTime.UtcNow,
                    Estado =
                        "Pendiente",
                    Total =
                        0,
                    NumeroPedido =
                        ultimoNumero + 1,
                    CodigoQRPedido =
                        Guid.NewGuid()
                            .ToString()
                };
            _context.Pedidos.Add(
                pedido
            );
            decimal total = 0;
            // =========================
            // PRODUCTOS
            // =========================
            foreach (
                var item in dto.Productos
            )
            {
                if (item.Cantidad <= 0)
                {
                    return BadRequest(
                        "La cantidad debe ser mayor que cero."
                    );
                }
                var producto =
                    await _context.Producto
                        .FirstOrDefaultAsync(p =>
                            p.Id ==
                                item.ProductoId &&
                            p.RestaurantId ==
                                restaurantId
                        );
                if (producto == null)
                {
                    return BadRequest(
                        $"El producto {item.ProductoId} no existe."
                    );
                }
                if (!producto.Disponible)
                {
                    return BadRequest(
                        $"{producto.Nombre} no está disponible."
                    );
                }
                // =========================
                // PRODUCTO PRINCIPAL
                // =========================
                var subtotal =
                    producto.Precio *
                    item.Cantidad;
                total += subtotal;
                var detallePrincipal =
                    new DetallePedido
                    {
                        Pedido =
                            pedido,
                        ProductoId =
                            producto.Id,
                        Cantidad =
                            item.Cantidad,
                        PrecioUnitario =
                            producto.Precio,
                        Observaciones =
                            item.Observaciones,
                        Subtotal =
                            subtotal
                    };
                _context.DetallesPedido.Add(
                    detallePrincipal
                );
                // =========================
                // EXTRAS
                // =========================
                if (
                    item.Extras != null &&
                    item.Extras.Any()
                )
                {
                    if (
                        !producto
                            .CategoriaExtrasId
                            .HasValue
                    )
                    {
                        return BadRequest(
                            $"{producto.Nombre} no permite extras."
                        );
                    }
                    foreach (
                        var extraDto in
                        item.Extras
                    )
                    {
                        var extra =
                            await _context.Producto
                                .FirstOrDefaultAsync(p =>
                                    p.Id ==
                                        extraDto.ProductoId &&
                                    p.RestaurantId ==
                                        restaurantId
                                );
                        if (extra == null)
                        {
                            return BadRequest(
                                $"El extra {extraDto.ProductoId} no existe."
                            );
                        }
                        if (!extra.Disponible)
                        {
                            return BadRequest(
                                $"{extra.Nombre} no está disponible."
                            );
                        }
                        if (
                            extra.CategoriaId !=
                            producto
                                .CategoriaExtrasId
                                .Value
                        )
                        {
                            return BadRequest(
                                $"{extra.Nombre} no es un extra válido para {producto.Nombre}."
                            );
                        }
                        var cantidadExtra =
                            extraDto.Cantidad <= 0
                                ? 1
                                : extraDto.Cantidad;
                        var subtotalExtra =
                            extra.Precio *
                            cantidadExtra;
                        total +=
                            subtotalExtra;
                        var detalleExtra =
                            new DetallePedido
                            {
                                Pedido =
                                    pedido,
                                ProductoId =
                                    extra.Id,
                                Cantidad =
                                    cantidadExtra,
                                PrecioUnitario =
                                    extra.Precio,
                                Subtotal =
                                    subtotalExtra,
                                DetallePadre =
                                    detallePrincipal
                            };
                        _context.DetallesPedido.Add(
                            detalleExtra
                        );
                    }
                }
            }
            // =========================
            // TOTAL
            // =========================
            pedido.Total =
                total;
            await _context
                .SaveChangesAsync();
            await transaction
                .CommitAsync();
            // =========================
            // RESPUESTA
            // =========================
            return Ok(new
            {
                pedidoId =
                    pedido.Id,
                numeroPedido =
                    pedido.NumeroPedido,
                codigoPedido =
                    pedido.CodigoQRPedido,
                tipoPedido =
                    pedido.TipoPedido,
                total =
                    pedido.Total,
                restaurant =
                    restaurant.Name,
                telefonoRestaurant =
                    restaurant.Phone
            });
        }
        catch (Exception ex)
        {
            await transaction
                .RollbackAsync();
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

            // Mantengo tu lógica actual
            if (!esAdmin)
            {
                query = query.Where(
                    p => p.RestaurantId == restaurantId
                );
            }

            var pedido =
                await query.FirstOrDefaultAsync();

            if (pedido == null)
            {
                return NotFound(
                    "Pedido no encontrado.");
            }

            // Pedido terminado ya no se modifica
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

            // El producto debe pertenecer
            // al mismo restaurante del pedido
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
                    $"El producto {producto.Nombre} no está disponible."
                );
            }

            var tieneExtras =
                dto.Extras != null &&
                dto.Extras.Any();

            /*
             * IMPORTANTE:
             *
             * Los productos configurables se guardan
             * unidad por unidad.
             *
             * Así podemos tener:
             *
             * Hamburguesa #1 + Pepinillo
             * Hamburguesa #2 + Tocino
             */
            if (producto.CategoriaExtrasId.HasValue)
            {
                if (dto.Cantidad != 1)
                {
                    return BadRequest(
                        "Los productos personalizables deben agregarse una unidad a la vez."
                    );
                }

                // Crear SIEMPRE un detalle nuevo
                var detallePrincipal =
                    new DetallePedido
                    {
                        PedidoId = pedido.Id,
                        ProductoId = producto.Id,
                        Cantidad = 1,
                        PrecioUnitario = producto.Precio,
                        Observaciones = dto.Observaciones,
                        Subtotal = producto.Precio
                    };

                _context.DetallesPedido.Add(
                    detallePrincipal);

                // =========================
                // EXTRAS
                // =========================

                if (tieneExtras)
                {
                    foreach (
                        var extraDto in dto.Extras!)
                    {
                        var extra =
                            await _context.Producto
                                .FirstOrDefaultAsync(p =>
                                    p.Id ==
                                        extraDto.ProductoId &&
                                    p.RestaurantId ==
                                        pedido.RestaurantId);

                        if (extra == null)
                        {
                            return BadRequest(
                                $"El extra {extraDto.ProductoId} no existe para este restaurante."
                            );
                        }

                        if (!extra.Disponible)
                        {
                            return BadRequest(
                                $"El extra {extra.Nombre} no está disponible."
                            );
                        }

                        // Seguridad:
                        // comprobar que realmente pertenece
                        // a la categoría de extras del producto
                        if (extra.CategoriaId !=
                            producto.CategoriaExtrasId.Value)
                        {
                            return BadRequest(
                                $"El producto {extra.Nombre} no es un extra válido para {producto.Nombre}."
                            );
                        }

                        var cantidadExtra =
                            extraDto.Cantidad <= 0
                                ? 1
                                : extraDto.Cantidad;

                        var detalleExtra =
                            new DetallePedido
                            {
                                PedidoId = pedido.Id,

                                ProductoId = extra.Id,

                                Cantidad =
                                    cantidadExtra,

                                PrecioUnitario =
                                    extra.Precio,

                                Subtotal =
                                    extra.Precio *
                                    cantidadExtra,

                                // Relacionar este extra
                                // con ESTA unidad específica
                                DetallePadre =
                                    detallePrincipal
                            };

                        _context.DetallesPedido.Add(
                            detalleExtra);
                    }
                }
            }
            else
            {
                /*
                 * Producto normal:
                 * Coca, papas, bebida, etc.
                 *
                 * Estos sí se pueden acumular.
                 */

                if (tieneExtras)
                {
                    return BadRequest(
                        $"El producto {producto.Nombre} no permite extras."
                    );
                }

                var detalle =
                    await _context.DetallesPedido
                        .FirstOrDefaultAsync(d =>
                            d.PedidoId == pedido.Id &&
                            d.ProductoId == producto.Id &&
                            d.DetallePadreId == null);

                if (detalle != null)
                {
                    detalle.Cantidad +=
                        dto.Cantidad;

                    detalle.Subtotal =
                        detalle.Cantidad *
                        detalle.PrecioUnitario;

                    if (!string.IsNullOrWhiteSpace(
                        dto.Observaciones))
                    {
                        detalle.Observaciones =
                            dto.Observaciones;
                    }
                }
                else
                {
                    detalle =
                        new DetallePedido
                        {
                            PedidoId = pedido.Id,

                            ProductoId =
                                producto.Id,

                            Cantidad =
                                dto.Cantidad,

                            PrecioUnitario =
                                producto.Precio,

                            Observaciones =
                                dto.Observaciones,

                            Subtotal =
                                producto.Precio *
                                dto.Cantidad
                        };

                    _context.DetallesPedido.Add(
                        detalle);
                }
            }

            // Primero guardar detalles y extras
            await _context.SaveChangesAsync();

            // Recalcular TOTAL incluyendo extras
            pedido.Total =
                await _context.DetallesPedido
                    .Where(d =>
                        d.PedidoId == pedido.Id)
                    .SumAsync(d =>
                        d.Subtotal);

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return Ok(new
            {
                mensaje =
                    "Producto agregado correctamente.",

                pedidoId =
                    pedido.Id,

                nuevoTotal =
                    pedido.Total
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();

            return StatusCode(
                500,
                $"Error al agregar el producto: {ex.Message}"
            );
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
                tipoPedido = p.TipoPedido,
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
            .FirstOrDefaultAsync(p =>
                p.CodigoQRPedido == id);

        if (pedido == null)
            return NotFound();

        return Ok(new
        {
            id = pedido.Id,

            tipoPedido = pedido.TipoPedido,

            restaurant =
                pedido.Restaurant?.Name,

            mesa =
                pedido.Mesa?.Number,

            cliente = pedido.Cliente == null
                ? null
                : new
                {
                    id = pedido.Cliente.Id,
                    nombre = pedido.Cliente.NombreCompleto,
                    telefono = pedido.Cliente.Telefono,
                    tipoPedido = pedido.TipoPedido,
                    direccion = pedido.Cliente.Direccion
                },

            estado =
                pedido.Estado,

            total =
                pedido.Total,

            numeroPedido =
                pedido.NumeroPedido,

            fecha =
                pedido.Fecha,

            codigoQR =
                pedido.CodigoQRPedido,

            /*
             * Solo devolvemos como productos principales
             * los detalles que NO tienen padre.
             */
            detalles = pedido.Detalles
                .Where(d =>
                    d.DetallePadreId == null)
                .Select(d => new
                {
                    id = d.Id,

                    producto =
                        d.Producto?.Nombre,

                    cantidad =
                        d.Cantidad,

                    precioUnitario =
                        d.PrecioUnitario,

                    subtotal =
                        d.Subtotal,

                    observaciones =
                        d.Observaciones,

                    /*
                     * Buscar todos los detalles cuyo
                     * DetallePadreId apunte a ESTE producto.
                     */
                    extras = pedido.Detalles
                        .Where(e =>
                            e.DetallePadreId == d.Id)
                        .Select(e => new
                        {
                            id = e.Id,

                            producto =
                                e.Producto?.Nombre,

                            cantidad =
                                e.Cantidad,

                            precioUnitario =
                                e.PrecioUnitario,

                            subtotal =
                                e.Subtotal
                        })
                        .ToList()
                })
                .ToList()
        });
    }

    [HttpGet("cocina")]
    [Authorize]
    public async Task<IActionResult> ObtenerPedidosCocina()
    {
        var restaurantId = ObtenerRestaurantId();
        var esAdmin = User.IsInRole("Admin");
        // ==========================================
        // RANGO DEL DÍA ACTUAL EN COSTA RICA
        // ==========================================
        var (inicio, fin) =
            FechaHelper.ObtenerRangoHoyCostaRica();
        var query = _context.Pedidos
            .Include(p => p.Mesa)
            .Include(p => p.Cliente)
            .Include(p => p.Detalles)
                .ThenInclude(d => d.Producto)
            .AsQueryable();
        // ==========================================
        // SEGURIDAD POR RESTAURANTE
        // ==========================================
        if (!esAdmin)
        {
            query = query.Where(
                p => p.RestaurantId == restaurantId
            );
        }
        // ==========================================
        // SOLO PEDIDOS ACTIVOS DE HOY
        // ==========================================
        var pedidos = await query
            .Where(p =>
                p.Fecha >= inicio &&
                p.Fecha < fin &&
                (
                    p.Estado == "Pendiente" ||
                    p.Estado == "Preparando"
                )
            )
            .OrderBy(p => p.Fecha)
            .ToListAsync();
        // ==========================================
        // RESPUESTA
        // ==========================================
        return Ok(
            pedidos.Select(p => new
            {
                id = p.Id,
                mesa = p.Mesa?.Number,
                cliente = p.Cliente == null
                    ? null
                    : new
                    {
                        nombre =
                            p.Cliente.NombreCompleto,
                        telefono =
                            p.Cliente.Telefono,
                        direccion =
                            p.Cliente.Direccion
                    },
                estado =
                    p.Estado,
                fecha =
                    p.Fecha,
                tipoPedido =
                    p.TipoPedido,
                total =
                    p.Total,
                numeroPedido =
                    p.NumeroPedido,
                // ==================================
                // PRODUCTOS PRINCIPALES
                // ==================================
                detalles = p.Detalles
                    .Where(d =>
                        d.DetallePadreId == null
                    )
                    .Select(d => new
                    {
                        id =
                            d.Id,
                        producto =
                            d.Producto!.Nombre,
                        cantidad =
                            d.Cantidad,
                        observaciones =
                            d.Observaciones,
                        // ==========================
                        // EXTRAS DEL PRODUCTO
                        // ==========================
                        extras = p.Detalles
                            .Where(e =>
                                e.DetallePadreId ==
                                d.Id
                            )
                            .Select(e => new
                            {
                                id =
                                    e.Id,
                                producto =
                                    e.Producto!.Nombre,
                                cantidad =
                                    e.Cantidad
                            })
                            .ToList()
                    })
                    .ToList()
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
        // Rango del día actual en Costa Rica
        var (inicio, fin) =
            FechaHelper.ObtenerRangoHoyCostaRica();
        var query = _context.Pedidos
            .Include(p => p.Mesa)
            .Include(p => p.Cliente)
            .Include(p => p.Detalles)
                .ThenInclude(d => d.Producto)
            .AsQueryable();
        if (!esAdmin)
        {
            query = query.Where(
                p => p.RestaurantId == restaurantId
            );
        }
        var pedidos = await query
            // Solo pedidos LISTOS del día actual
            .Where(p =>
                p.Estado == "Listo" &&
                p.Fecha >= inicio &&
                p.Fecha < fin
            )
            .OrderBy(p => p.Fecha)
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
                        nombre =
                            p.Cliente.NombreCompleto,
                        telefono =
                            p.Cliente.Telefono,
                        direccion =
                            p.Cliente.Direccion
                    },
                total = p.Total,
                numeroPedido =
                    p.NumeroPedido,
                tipoPedido =
                    p.TipoPedido,
                fecha =
                    p.Fecha,
                // =========================
                // PRODUCTOS PRINCIPALES
                // =========================
                detalles = p.Detalles
                    .Where(d =>
                        d.DetallePadreId == null
                    )
                    .Select(d => new
                    {
                        id = d.Id,
                        producto =
                            d.Producto!.Nombre,
                        cantidad =
                            d.Cantidad,
                        precioUnitario =
                            d.PrecioUnitario,
                        subtotal =
                            d.Subtotal,
                        observaciones =
                            d.Observaciones,
                        // =========================
                        // EXTRAS
                        // =========================
                        extras = p.Detalles
                            .Where(e =>
                                e.DetallePadreId ==
                                d.Id
                            )
                            .Select(e => new
                            {
                                id =
                                    e.Id,
                                producto =
                                    e.Producto!.Nombre,
                                cantidad =
                                    e.Cantidad,
                                precioUnitario =
                                    e.PrecioUnitario,
                                subtotal =
                                    e.Subtotal
                            })
                            .ToList()
                    })
                    .ToList()
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

        var (inicio, fin) =
            FechaHelper.ObtenerRangoHoyCostaRica();

        // =====================================================
        // PEDIDOS TERMINADOS DEL DÍA
        // =====================================================

        var pedidos = await _context.Pedidos
            .Where(p =>
                p.RestaurantId == restaurantId &&
                p.Fecha >= inicio &&
                p.Fecha < fin &&
                p.Estado == "Terminado")
            .ToListAsync();

        // =====================================================
        // RESUMEN GENERAL
        // =====================================================

        var cantidadPedidos =
            pedidos.Count;

        var totalVentas =
            pedidos.Sum(p => p.Total);

        // =====================================================
        // 🪑 PEDIDOS DE MESA
        // =====================================================

        var pedidosMesa = pedidos
            .Where(p =>
                p.TipoPedido == "Mesa")
            .ToList();

        // =====================================================
        // 🛵 PEDIDOS XPRESS
        // =====================================================

        var pedidosXpress = pedidos
            .Where(p =>
                p.TipoPedido == "Xpress")
            .ToList();

        // =====================================================
        // 🥡 PEDIDOS PARA LLEVAR
        // =====================================================

        var pedidosLlevar = pedidos
            .Where(p =>
                p.TipoPedido == "Llevar")
            .ToList();

        // =====================================================
        // RESPUESTA
        // =====================================================

        return Ok(new
        {
            cantidadPedidos,

            totalVentas,

            ticketPromedio =
                cantidadPedidos > 0
                    ? totalVentas / cantidadPedidos
                    : 0,

            mesa = new
            {
                cantidad =
                    pedidosMesa.Count,

                total =
                    pedidosMesa.Sum(p =>
                        p.Total)
            },

            xpress = new
            {
                cantidad =
                    pedidosXpress.Count,

                total =
                    pedidosXpress.Sum(p =>
                        p.Total)
            },

            llevar = new
            {
                cantidad =
                    pedidosLlevar.Count,

                total =
                    pedidosLlevar.Sum(p =>
                        p.Total)
            }
        });
    }

    [HttpGet("reporte-diario")]
    [Authorize]
    public async Task<IActionResult> ObtenerReporteDiario(
   [FromQuery] DateOnly fecha)
    {
        var restaurantId =
            ObtenerRestaurantId();
        var (inicio, fin) =
            FechaHelper.ObtenerRangoFechaCostaRica(
                fecha);
        // ==========================================
        // PEDIDOS TERMINADOS DEL DÍA
        // ==========================================
        var pedidos =
            await _context.Pedidos
                .Include(p =>
                    p.Mesa)
                .Include(p =>
                    p.Detalles)
                    .ThenInclude(d =>
                        d.Producto)
                .Where(p =>
                    p.RestaurantId ==
                        restaurantId &&
                    p.Fecha >= inicio &&
                    p.Fecha < fin &&
                    p.Estado ==
                        "Terminado")
                .OrderBy(p =>
                    p.Fecha)
                .ToListAsync();
        // ==========================================
        // RESUMEN GENERAL
        // ==========================================
        var cantidadPedidos =
            pedidos.Count;
        var totalVentas =
            pedidos.Sum(p =>
                p.Total);
        var ticketPromedio =
            cantidadPedidos > 0
                ? totalVentas /
                    cantidadPedidos
                : 0;
        // ==========================================
        // TIPOS DE PEDIDO
        // ==========================================
        var pedidosMesa =
            pedidos
                .Where(p =>
                    p.TipoPedido ==
                        "Mesa")
                .ToList();
        var pedidosXpress =
            pedidos
                .Where(p =>
                    p.TipoPedido ==
                        "Xpress")
                .ToList();
        var pedidosLlevar =
            pedidos
                .Where(p =>
                    p.TipoPedido ==
                        "Llevar")
                .ToList();
        decimal CalcularPorcentaje(
            List<Pedido> lista)
        {
            var total =
                lista.Sum(p =>
                    p.Total);
            if (totalVentas <= 0)
                return 0;
            return Math.Round(
                total /
                totalVentas *
                100,
                1);
        }
        // ==========================================
        // DETALLE DE PEDIDOS
        // ==========================================
        var detallePedidos =
            pedidos.Select(p =>
            {
                var detallesPrincipales =
                    p.Detalles
                        .Where(d =>
                            d.DetallePadreId ==
                                null)
                        .ToList();
                var extras =
                    p.Detalles
                        .Where(d =>
                            d.DetallePadreId !=
                                null)
                        .ToList();
                return new
                {
                    id =
                        p.Id,
                    numeroPedido =
                        p.NumeroPedido,
                    fecha =
                        p.Fecha,
                    tipoPedido =
                        p.TipoPedido,
                    mesa =
                        p.Mesa != null
                            ? p.Mesa.Number
                            : (int?)null,
                    cantidadProductos =
                        detallesPrincipales
                            .Sum(d =>
                                d.Cantidad),
                    cantidadExtras =
                        extras.Sum(d =>
                            d.Cantidad),
                    total =
                        p.Total
                };
            })
            .ToList();
        // ==========================================
        // PRODUCTOS PRINCIPALES VENDIDOS
        // ==========================================
        /*
         * Importante:
         *
         * Solo contamos DetallePadreId == null.
         *
         * De esta manera:
         * Queso, tocino, jalapeño, etc.
         * NO inflan el ranking de productos.
         */
        var productosVendidos =
            pedidos
                .SelectMany(p =>
                    p.Detalles)
                .Where(d =>
                    d.DetallePadreId ==
                        null)
                .GroupBy(d => new
                {
                    d.ProductoId,
                    Nombre =
                        d.Producto != null
                            ? d.Producto.Nombre
                            : ""
                })
                .Select(g => new
                {
                    productoId =
                        g.Key.ProductoId,
                    nombre =
                        g.Key.Nombre,
                    unidades =
                        g.Sum(d =>
                            d.Cantidad),
                    monto =
                        g.Sum(d =>
                            d.Subtotal)
                })
                .OrderByDescending(x =>
                    x.unidades)
                .ThenByDescending(x =>
                    x.monto)
                .ToList();
        // ==========================================
        // RESPUESTA
        // ==========================================
        return Ok(new
        {
            fecha =
                fecha.ToString(
                    "yyyy-MM-dd"),
            cantidadPedidos,
            totalVentas,
            ticketPromedio,
            tiposPedido = new
            {
                mesa = new
                {
                    cantidad =
                        pedidosMesa.Count,
                    porcentaje =
                        CalcularPorcentaje(
                            pedidosMesa),
                    total =
                        pedidosMesa.Sum(p =>
                            p.Total)
                },
                xpress = new
                {
                    cantidad =
                        pedidosXpress.Count,
                    porcentaje =
                        CalcularPorcentaje(
                            pedidosXpress),
                    total =
                        pedidosXpress.Sum(p =>
                            p.Total)
                },
                llevar = new
                {
                    cantidad =
                        pedidosLlevar.Count,
                    porcentaje =
                        CalcularPorcentaje(
                            pedidosLlevar),
                    total =
                        pedidosLlevar.Sum(p =>
                            p.Total)
                }
            },
            pedidos =
                detallePedidos,
            productos =
                productosVendidos
        });
    }

    [HttpGet("reporte-mensual")]
    [Authorize]
    public async Task<IActionResult> ObtenerReporteMensual(
    int anio,
    int mes)
    {
        if (mes < 1 || mes > 12)
        {
            return BadRequest(
                "El mes debe estar entre 1 y 12."
            );
        }

        if (anio < 2020 || anio > 2100)
        {
            return BadRequest(
                "El año no es válido."
            );
        }

        var restaurantId =
            ObtenerRestaurantId();

        var primerDia =
            new DateOnly(
                anio,
                mes,
                1
            );

        var siguienteMes =
            primerDia.AddMonths(1);

        var (inicio, _) =
            FechaHelper.ObtenerRangoFechaCostaRica(
                primerDia
            );

        var (fin, _) =
            FechaHelper.ObtenerRangoFechaCostaRica(
                siguienteMes
            );

        // ==========================================
        // PEDIDOS DEL MES
        // ==========================================

        var pedidos =
            await _context.Pedidos
                .Where(p =>
                    p.RestaurantId == restaurantId &&
                    p.Fecha >= inicio &&
                    p.Fecha < fin &&
                    p.Estado == "Terminado"
                )
                .Include(p => p.Cliente)
                .Include(p => p.Mesa)
                .ToListAsync();

        var cantidadPedidos =
            pedidos.Count;

        var totalVentas =
            pedidos.Sum(p => p.Total);

        var ticketPromedio =
            cantidadPedidos > 0
                ? totalVentas / cantidadPedidos
                : 0;

        // ==========================================
        // TIPOS DE PEDIDO
        // ==========================================

        var pedidosMesa =
            pedidos
                .Where(p =>
                    p.TipoPedido == "Mesa")
                .ToList();

        var pedidosXpress =
            pedidos
                .Where(p =>
                    p.TipoPedido == "Xpress")
                .ToList();

        var pedidosLlevar =
            pedidos
                .Where(p =>
                    p.TipoPedido == "Llevar")
                .ToList();

        decimal Porcentaje(int cantidad)
        {
            if (cantidadPedidos == 0)
                return 0;

            return Math.Round(
                (decimal)cantidad /
                cantidadPedidos * 100,
                1
            );
        }

        // ==========================================
        // VENTAS POR DÍA
        // ==========================================

        var ventasPorDia =
            pedidos
                .GroupBy(p =>
                    FechaCostaRica(p.Fecha)
                        .Date
                )
                .Select(g => new
                {
                    fecha =
                        g.Key,

                    pedidos =
                        g.Count(),

                    total =
                        g.Sum(p => p.Total)
                })
                .OrderBy(x => x.fecha)
                .ToList();

        var mejorDia =
            ventasPorDia
                .OrderByDescending(x =>
                    x.total)
                .FirstOrDefault();

        // ==========================================
        // PRODUCTOS
        // ==========================================

        var pedidoIds =
            pedidos
                .Select(p => p.Id)
                .ToList();

        var productos =
            await _context.DetallesPedido

                .Where(d =>
                    pedidoIds.Contains(
                        d.PedidoId
                    ) &&
                    d.DetallePadreId == null
                )

                .Include(d => d.Producto)

                .GroupBy(d => new
                {
                    d.ProductoId,
                    Nombre =
                        d.Producto != null
                            ? d.Producto.Nombre
                            : ""
                })

                .Select(g => new
                {
                    productoId =
                        g.Key.ProductoId,

                    nombre =
                        g.Key.Nombre,

                    unidades =
                        g.Sum(d =>
                            d.Cantidad),

                    monto =
                        g.Sum(d =>
                            d.Subtotal)
                })

                .OrderByDescending(x =>
                    x.unidades)

                .Take(5)

                .ToListAsync();

        // ==========================================
        // CLIENTES
        // ==========================================

        var pedidosConCliente =
            pedidos
                .Where(p =>
                    p.ClienteId.HasValue)
                .ToList();

        var clientesUnicos =
            pedidosConCliente
                .Select(p =>
                    p.ClienteId!.Value)
                .Distinct()
                .Count();

        var clientesRecurrentes =
            pedidosConCliente
                .GroupBy(p =>
                    p.ClienteId)
                .Count(g =>
                    g.Count() > 1);

        // ==========================================
        // RESPUESTA
        // ==========================================

        return Ok(new
        {
            anio,
            mes,

            totalVentas,

            cantidadPedidos,

            ticketPromedio,

            mejorDia,

            ventasPorDia,

            tiposPedido = new
            {
                mesa = new
                {
                    cantidad =
                        pedidosMesa.Count,

                    porcentaje =
                        Porcentaje(
                            pedidosMesa.Count
                        ),

                    total =
                        pedidosMesa.Sum(
                            p => p.Total
                        )
                },

                xpress = new
                {
                    cantidad =
                        pedidosXpress.Count,

                    porcentaje =
                        Porcentaje(
                            pedidosXpress.Count
                        ),

                    total =
                        pedidosXpress.Sum(
                            p => p.Total
                        )
                },

                llevar = new
                {
                    cantidad =
                        pedidosLlevar.Count,

                    porcentaje =
                        Porcentaje(
                            pedidosLlevar.Count
                        ),

                    total =
                        pedidosLlevar.Sum(
                            p => p.Total
                        )
                }
            },

            productos,

            clientes = new
            {
                unicos =
                    clientesUnicos,

                recurrentes =
                    clientesRecurrentes
            }
        });
    }

    private int ObtenerRestaurantId()
    {
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

    private DateTime FechaCostaRica(
    DateTime fechaUtc)
    {
        TimeZoneInfo zona;

        try
        {
            zona =
                TimeZoneInfo.FindSystemTimeZoneById(
                    "America/Costa_Rica"
                );
        }
        catch
        {
            zona =
                TimeZoneInfo.FindSystemTimeZoneById(
                    "Central America Standard Time"
                );
        }

        return TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.SpecifyKind(
                fechaUtc,
                DateTimeKind.Utc
            ),
            zona
        );
    }
}