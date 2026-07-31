using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantHub.Api.Data;
using RestaurantHub.Api.Models;
namespace RestaurantHub.Api.Controllers;

using RestaurantHub.Core.Entities;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
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
        return await _context.Producto.Where(p => p.RestaurantId == restaurantId).ToListAsync();
    }
    [HttpGet("{id}")]
    public async Task<ActionResult<Producto>> GetProducto(int id)
    {
        var restaurantId = ObtenerRestaurantId();
        var producto = await _context.Producto
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
    [HttpPut("{id}")]
    public async Task<IActionResult> ActualizarProducto(int id, Producto producto)
    {
        if (id != producto.Id)
            return BadRequest();
        _context.Entry(producto).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Producto.Any(p => p.Id == id))
                return NotFound();
            throw;
        }
        return NoContent();
    }
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
        return int.Parse(
            User.FindFirst("RestaurantId")!.Value
        );
    }
}