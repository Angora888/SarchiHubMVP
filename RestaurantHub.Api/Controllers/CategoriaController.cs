using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantHub.Api.Data;
using RestaurantHub.Core.Entities;
using Microsoft.AspNetCore.Authorization;
namespace RestaurantHub.Api.Controllers;
using RestaurantHub.Api.DTOs;

[ApiController]
[Route("api/[controller]")]

public class CategoriaController : ControllerBase
{
    private readonly RestaurantHubContext _context;
    public CategoriaController(RestaurantHubContext context)
    {
        _context = context;
    }
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Categoria>>> GetCategorias()
    {
        return await _context.Categoria.ToListAsync();
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<Categoria>> CreateCategoria(CategoriaUpdateDto dto)
    {
        var categoria = new Categoria
        {
            Name = dto.Name,
            RestaurantId = ObtenerRestaurantId()
        };
        _context.Categoria.Add(categoria);
        await _context.SaveChangesAsync();
        return CreatedAtAction(
            nameof(GetCategoriaById),
            new { id = categoria.Id },
            categoria
        );
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Categoria>> GetCategoriaById(int id)
    {
        var categoria = await _context.Categoria.FindAsync(id);
        if (categoria == null)
        {
            return NotFound();
        }
        return categoria;
    }

    //[HttpPut("{id}")]
    //[Authorize]
    //public async Task<IActionResult> UpdateCategoria(int id, Categoria categoria)
    //{
    //    if (id != categoria.Id)
    //    {
    //        return BadRequest();
    //    }
    //    _context.Entry(categoria).State = EntityState.Modified;
    //    try
    //    {
    //        await _context.SaveChangesAsync();
    //    }
    //    catch (DbUpdateConcurrencyException)
    //    {
    //        if (!CategoriaExists(id))
    //            return NotFound();
    //        throw;
    //    }
    //    return NoContent();
    //}

    [HttpPut("{id}")]
    [Authorize ]
    public async Task<IActionResult> UpdateCategoria(
   int id,
   CategoriaUpdateDto dto)
    {
        var restaurantId = ObtenerRestaurantId();
        var categoria = await _context.Categoria
            .FirstOrDefaultAsync(c =>
                c.Id == id &&
                c.RestaurantId == restaurantId);
        if (categoria == null)
            return NotFound();
        categoria.Name = dto.Name;
        await _context.SaveChangesAsync();
        return Ok();
    }

    private bool CategoriaExists(int id)
    {
        return _context.Categoria.Any(e => e.Id == id);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteCategoria(int id)
    {
        var categoria = await _context.Categoria.FindAsync(id);
        if (categoria == null)
            return NotFound();
        _context.Categoria.Remove(categoria);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("admin")]
    [Authorize]
    public async Task<IActionResult> ObtenerCategoriasAdmin()
    {
        var restaurantId = ObtenerRestaurantId();
        var esAdmin = User.IsInRole("Admin");
        var query = _context.Categoria.AsQueryable();
        if (!esAdmin)
        {
            query = query.Where(c => c.RestaurantId == restaurantId);
        }
        var categorias = await query
            .Select(c => new
            {
                c.Id,
                c.Name,
                CantidadProductos = c.Productos.Count
            })
            .OrderBy(c => c.Name)
            .ToListAsync();
        return Ok(categorias);
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