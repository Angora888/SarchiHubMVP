using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantHub.Api.Data;
using RestaurantHub.Api.Models;
namespace RestaurantHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MesasController : ControllerBase
{
    private readonly RestaurantHubContext _context;
    public MesasController(RestaurantHubContext context)
    {
        _context = context;
    }
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Mesa>>> GetMesas()
    {
        //return await _context.Mesa.Include(m => m.Restaurant).ToListAsync();
        return await _context.Mesa.ToListAsync();
    }
    [HttpGet("{id}")]
    public async Task<ActionResult<Mesa>> GetMesa(int id)
    {
        //var mesa = await _context.Mesa.Include(m => m.Restaurant).FirstOrDefaultAsync(m => m.Id == id);
        var mesa = await _context.Mesa.FindAsync(id);

        if (mesa == null)
            return NotFound();
        return mesa;
    }
    [HttpPost]
    public async Task<ActionResult<Mesa>> CrearMesa(Mesa mesa)
    {
        _context.Mesa.Add(mesa);
        mesa.CodigoQR = Guid.NewGuid().ToString();
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetMesa), new { id = mesa.Id }, mesa);
    }
    [HttpPut("{id}")]
    public async Task<IActionResult> ActualizarMesa(int id, Mesa mesa)
    {
        if (id != mesa.Id)
            return BadRequest();
        _context.Entry(mesa).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }
    [HttpDelete("{id}")]
    public async Task<IActionResult> EliminarMesa(int id)
    {
        var mesa = await _context.Mesa.FindAsync(id);
        if (mesa == null)
            return NotFound();
        _context.Mesa.Remove(mesa);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("qr/{codigo}")]
    public async Task<IActionResult> ObtenerMesaPorQr(string codigo)
    {
        var mesa = await _context.Mesa
            .Include(m => m.Restaurant)
            .FirstOrDefaultAsync(m => m.CodigoQR == codigo);
        if (mesa == null)
            return NotFound("QR inválido.");
        return Ok(new
        {
            mesa.Id,
            mesa.Number,
            Restaurante = mesa.Restaurant?.Name
        });
    }
}