using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantHub.Api.Data;
using RestaurantHub.Api.DTOs;
using RestaurantHub.Api.Models;
using RestaurantHub.Core.Entities;
using System.Security.Claims;

namespace RestaurantHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductosController : ControllerBase
{
    private readonly RestaurantHubContext _context;

    public ProductosController(RestaurantHubContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Producto>>> GetProductos()
    {
        var restaurantId = ObtenerRestaurantId();

        return await _context.Producto
            .Where(p => p.RestaurantId == restaurantId)
            .OrderBy(p => p.Id)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Producto>> GetProducto(int id)
    {
        var restaurantId = ObtenerRestaurantId();

        var producto = await _context.Producto
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p =>
                p.Id == id &&
                p.RestaurantId == restaurantId);

        if (producto == null)
            return NotFound();

        return producto;
    }

    [HttpPost]
    public async Task<ActionResult<Producto>> CrearProducto(Producto producto)
    {
        var restaurantId = ObtenerRestaurantId();

        // Validar que la categoría principal pertenezca al restaurante
        var categoriaExiste = await _context.Categoria
            .AnyAsync(c =>
                c.Id == producto.CategoriaId &&
                c.RestaurantId == restaurantId);

        if (!categoriaExiste)
        {
            return BadRequest(
                "La categoría seleccionada no pertenece a este restaurante.");
        }

        // Si seleccionaron una categoría de extras,
        // validar que también pertenezca al restaurante
        if (producto.CategoriaExtrasId.HasValue)
        {
            var categoriaExtrasExiste = await _context.Categoria
                .AnyAsync(c =>
                    c.Id == producto.CategoriaExtrasId.Value &&
                    c.RestaurantId == restaurantId);

            if (!categoriaExtrasExiste)
            {
                return BadRequest(
                    "La categoría de extras seleccionada no pertenece a este restaurante.");
            }
        }

        // Nunca confiamos en un RestaurantId enviado por frontend
        producto.RestaurantId = restaurantId;

        _context.Producto.Add(producto);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetProducto),
            new { id = producto.Id },
            producto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> EliminarProducto(int id)
    {
        var restaurantId = ObtenerRestaurantId();

        var producto = await _context.Producto
            .FirstOrDefaultAsync(p =>
                p.Id == id &&
                p.RestaurantId == restaurantId);

        if (producto == null)
            return NotFound();

        _context.Producto.Remove(producto);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("importar")]
    public async Task<IActionResult> ImportarProductos(
        List<Producto> productos)
    {
        if (productos == null || productos.Count == 0)
            return BadRequest("No hay productos.");

        var restaurantId = ObtenerRestaurantId();

        foreach (var producto in productos)
        {
            producto.RestaurantId = restaurantId;

            var categoriaExiste = await _context.Categoria
                .AnyAsync(c =>
                    c.Id == producto.CategoriaId &&
                    c.RestaurantId == restaurantId);

            if (!categoriaExiste)
            {
                return BadRequest(
                    $"La categoría del producto '{producto.Nombre}' no pertenece a este restaurante.");
            }

            if (producto.CategoriaExtrasId.HasValue)
            {
                var categoriaExtrasExiste = await _context.Categoria
                    .AnyAsync(c =>
                        c.Id == producto.CategoriaExtrasId.Value &&
                        c.RestaurantId == restaurantId);

                if (!categoriaExtrasExiste)
                {
                    return BadRequest(
                        $"La categoría de extras del producto '{producto.Nombre}' no pertenece a este restaurante.");
                }
            }
        }

        _context.Producto.AddRange(productos);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje = $"{productos.Count} productos importados."
        });
    }

    private int ObtenerRestaurantId()
    {
        if (!User.Identity?.IsAuthenticated ?? true)
        {
            throw new UnauthorizedAccessException(
                "El usuario no está autenticado.");
        }

        var claimRestaurant = User.FindFirst("RestaurantId");

        if (claimRestaurant == null)
        {
            throw new UnauthorizedAccessException(
                "El token no contiene el claim RestaurantId.");
        }

        if (!int.TryParse(
            claimRestaurant.Value,
            out var restaurantId))
        {
            throw new UnauthorizedAccessException(
                "El RestaurantId del token no es válido.");
        }

        return restaurantId;
    }

    [HttpGet("admin")]
    public async Task<IActionResult> ObtenerProductosAdmin()
    {
        var restaurantId = ObtenerRestaurantId();
        var esAdmin = User.IsInRole("Admin");

        var query = _context.Producto.AsQueryable();

        if (!esAdmin)
        {
            query = query.Where(p => p.RestaurantId == restaurantId);
        }

        var productos = await query
            .OrderBy(p => p.Nombre)
            .Select(p => new
            {
                p.Id,
                p.Nombre,
                p.Descripcion,
                p.Precio,
                p.Disponible,

                // Necesarios para editar categorías
                p.CategoriaId,
                p.CategoriaExtrasId
            })
            .ToListAsync();

        return Ok(productos);
    }

    [HttpGet("productos-xpress")]
    public async Task<IActionResult> ObtenerProductosXpress()
    {
        var restaurantId = ObtenerRestaurantId();

        var productos = await _context.Producto
            .Where(p =>
                p.RestaurantId == restaurantId &&
                p.Disponible)
            .OrderBy(p => p.Nombre)
            .Select(p => new
            {
                p.Id,
                p.Nombre,
                p.Descripcion,
                p.Precio,
                p.ImagenUrl,
                p.CategoriaId,

                // Nuevo:
                p.CategoriaExtrasId,

                Categoria = p.Categoria != null
                    ? p.Categoria.Name
                    : null
            })
            .ToListAsync();

        return Ok(productos);
    }

    [HttpGet("productos-disponibles/{codigoPedido}")]
    public async Task<IActionResult> ObtenerProductosDisponibles(
        string codigoPedido)
    {
        var pedido = await _context.Pedidos
            .FirstOrDefaultAsync(p =>
                p.CodigoQRPedido == codigoPedido);

        if (pedido == null)
            return NotFound("Pedido no encontrado.");

        if (pedido.Estado == "Terminado")
        {
            return BadRequest(
                "No se pueden agregar productos a un pedido terminado.");
        }

        var productos = await _context.Producto
            .Where(p =>
                p.RestaurantId == pedido.RestaurantId &&
                p.Disponible)
            .OrderBy(p => p.Nombre)
            .Select(p => new
            {
                p.Id,
                p.Nombre,
                p.Descripcion,
                p.Precio,
                p.ImagenUrl,
                p.CategoriaId,

                // También lo devolvemos aquí
                p.CategoriaExtrasId
            })
            .ToListAsync();

        return Ok(productos);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> ActualizarProducto(
        int id,
        ProductoUpdateDto dto)
    {
        var restaurantId = ObtenerRestaurantId();

        var producto = await _context.Producto
            .FirstOrDefaultAsync(p =>
                p.Id == id &&
                p.RestaurantId == restaurantId);

        if (producto == null)
            return NotFound();

        // Validar categoría principal
        var categoriaExiste = await _context.Categoria
            .AnyAsync(c =>
                c.Id == dto.CategoriaId &&
                c.RestaurantId == restaurantId);

        if (!categoriaExiste)
        {
            return BadRequest(
                "La categoría seleccionada no pertenece a este restaurante.");
        }

        // Validar categoría de extras
        if (dto.CategoriaExtrasId.HasValue)
        {
            var categoriaExtrasExiste = await _context.Categoria
                .AnyAsync(c =>
                    c.Id == dto.CategoriaExtrasId.Value &&
                    c.RestaurantId == restaurantId);

            if (!categoriaExtrasExiste)
            {
                return BadRequest(
                    "La categoría de extras seleccionada no pertenece a este restaurante.");
            }
        }

        producto.Nombre = dto.Nombre;
        producto.Descripcion = dto.Descripcion;
        producto.Precio = dto.Precio;
        producto.Disponible = dto.Disponible;

        producto.CategoriaId = dto.CategoriaId;
        producto.CategoriaExtrasId = dto.CategoriaExtrasId;

        await _context.SaveChangesAsync();

        return Ok();
    }
}