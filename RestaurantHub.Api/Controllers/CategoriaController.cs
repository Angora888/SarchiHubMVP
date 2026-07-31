using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantHub.Api.Data;
using RestaurantHub.Core.Entities;
namespace RestaurantHub.Api.Controllers;

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
    public async Task<ActionResult<Categoria>> CreateCategoria(Categoria categoria)
    {
        _context.Categoria.Add(categoria);
        await _context.SaveChangesAsync();
        return CreatedAtAction(
            nameof(GetCategoriaById),
            new { id = categoria.Id },
            categoria);
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

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCategoria(int id, Categoria categoria)
    {
        if (id != categoria.Id)
        {
            return BadRequest();
        }
        _context.Entry(categoria).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!CategoriaExists(id))
                return NotFound();
            throw;
        }
        return NoContent();
    }

    private bool CategoriaExists(int id)
    {
        return _context.Categoria.Any(e => e.Id == id);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCategoria(int id)
    {
        var categoria = await _context.Categoria.FindAsync(id);
        if (categoria == null)
            return NotFound();
        _context.Categoria.Remove(categoria);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}