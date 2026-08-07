using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantHub.Api.Data;
using RestaurantHub.Api.Models;
using RestaurantHub.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
namespace RestaurantHub.Api.Controllers;



using RestaurantHub.Core.Entities;
using System.Security.Claims;

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
        producto.RestaurantId = ObtenerRestaurantId();
        _context.Producto.Add(producto);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetProducto), new { id = producto.Id }, producto);
    }
    //[HttpPut("{id}")]
    //public async Task<IActionResult> ActualizarProducto(int id, Producto producto)
    //{
    //    if (id != producto.Id)
    //        return BadRequest();
    //    _context.Entry(producto).State = EntityState.Modified;
    //    try
    //    {
    //        await _context.SaveChangesAsync();
    //    }
    //    catch (DbUpdateConcurrencyException)
    //    {
    //        if (!_context.Producto.Any(p => p.Id == id))
    //            return NotFound();
    //        throw;
    //    }
    //    return NoContent();
    //}
    [HttpDelete("{id}")]
    public async Task<IActionResult> EliminarProducto(int id)
    {
        var producto = await _context.Producto.FindAsync(id);
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
        _context.Producto.AddRange(productos);
        await _context.SaveChangesAsync();
        return Ok(new
        {
            mensaje = $"{productos.Count} productos importados."
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
                p.Disponible
            })
            .ToListAsync();
        return Ok(productos);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> ActualizarProducto(int id, ProductoUpdateDto dto)
    {
        var restaurantId = ObtenerRestaurantId();
        var producto = await _context.Producto
            .FirstOrDefaultAsync(p => p.Id == id && p.RestaurantId == restaurantId);
        if (producto == null)
            return NotFound();
        producto.Nombre = dto.Nombre;
        producto.Descripcion = dto.Descripcion;
        producto.Precio = dto.Precio;
        producto.Disponible = dto.Disponible;
        await _context.SaveChangesAsync();
        return Ok();
    }
}