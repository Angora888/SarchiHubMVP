using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantHub.Api.Data;
using RestaurantHub.Api.DTOs;
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

    // ==========================================
    // LISTAR MESAS DEL RESTAURANTE AUTENTICADO
    // ==========================================

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<Mesa>>> GetMesas()
    {
        var restaurantId = ObtenerRestaurantId();

        var mesas = await _context.Mesa
            .Where(m =>
                m.RestaurantId == restaurantId)
            .OrderBy(m => m.Number)
            .ToListAsync();

        return Ok(mesas);
    }

    // ==========================================
    // OBTENER UNA MESA
    // ==========================================

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<Mesa>> GetMesa(int id)
    {
        var restaurantId = ObtenerRestaurantId();

        var mesa = await _context.Mesa
            .FirstOrDefaultAsync(m =>
                m.Id == id &&
                m.RestaurantId == restaurantId);

        if (mesa == null)
        {
            return NotFound(
                "Mesa no encontrada."
            );
        }

        return Ok(mesa);
    }

    // ==========================================
    // CREAR MESA
    // ==========================================

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<Mesa>> CrearMesa(
        CrearMesaDto dto)
    {
        var restaurantId = ObtenerRestaurantId();

        if (dto.Number <= 0)
        {
            return BadRequest(
                "El número de mesa debe ser mayor que cero."
            );
        }

        var existeMesa =
            await _context.Mesa
                .AnyAsync(m =>
                    m.RestaurantId == restaurantId &&
                    m.Number == dto.Number);

        if (existeMesa)
        {
            return Conflict(
                $"Ya existe la mesa #{dto.Number}."
            );
        }

        var mesa = new Mesa
        {
            Number = dto.Number,
            RestaurantId = restaurantId,
            Status = "Disponible",
            CodigoQR = Guid.NewGuid().ToString()
        };

        _context.Mesa.Add(mesa);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetMesa),
            new { id = mesa.Id },
            mesa
        );
    }

    // ==========================================
    // ELIMINAR MESA
    // ==========================================

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> EliminarMesa(int id)
    {
        var restaurantId = ObtenerRestaurantId();

        var mesa = await _context.Mesa
            .FirstOrDefaultAsync(m =>
                m.Id == id &&
                m.RestaurantId == restaurantId);

        if (mesa == null)
        {
            return NotFound(
                "Mesa no encontrada."
            );
        }

        if (mesa.Status == "Ocupada")
        {
            return Conflict(
                "No puede eliminar una mesa ocupada."
            );
        }

        _context.Mesa.Remove(mesa);

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // ==========================================
    // OBTENER MESA POR QR
    // PÚBLICO
    // ==========================================

    [HttpGet("qr/{codigo}")]
    [AllowAnonymous]
    public async Task<IActionResult> ObtenerMesaPorQr(
        string codigo)
    {
        var mesa = await _context.Mesa
            .Include(m => m.Restaurant)
            .FirstOrDefaultAsync(m =>
                m.CodigoQR == codigo &&
                m.Restaurant != null &&
                m.Restaurant.Active);

        if (mesa == null)
        {
            return NotFound(
                "QR inválido."
            );
        }

        return Ok(new
        {
            mesa.Id,
            mesa.Number,
            mesa.Status,

            Restaurante =
                mesa.Restaurant?.Name
        });
    }

    // ==========================================
    // ADMINISTRACIÓN DE MESAS
    // ==========================================

    [HttpGet("admin")]
    [Authorize]
    public async Task<IActionResult> ObtenerMesasAdmin()
    {
        var restaurantId = ObtenerRestaurantId();

        var mesas = await _context.Mesa
            .Include(m => m.Restaurant)

            .Where(m =>
                m.RestaurantId == restaurantId)

            .OrderBy(m => m.Number)

            .Select(m => new
            {
                m.Id,
                m.Number,
                m.CodigoQR,
                m.RestaurantId,

                Restaurante =
                    m.Restaurant != null
                        ? m.Restaurant.Name
                        : "",

                m.Status
            })

            .ToListAsync();

        return Ok(mesas);
    }

    // ==========================================
    // ACTUALIZAR MESA
    // ==========================================

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> ActualizarMesa(
        int id,
        MesaUpdateDto dto)
    {
        var restaurantId = ObtenerRestaurantId();

        var mesa = await _context.Mesa
            .FirstOrDefaultAsync(m =>
                m.Id == id &&
                m.RestaurantId == restaurantId);

        if (mesa == null)
        {
            return NotFound(
                "Mesa no encontrada."
            );
        }

        if (dto.Number <= 0)
        {
            return BadRequest(
                "El número de mesa debe ser mayor que cero."
            );
        }

        var existeNumero =
            await _context.Mesa
                .AnyAsync(m =>
                    m.RestaurantId == restaurantId &&
                    m.Number == dto.Number &&
                    m.Id != id);

        if (existeNumero)
        {
            return Conflict(
                $"Ya existe la mesa #{dto.Number}."
            );
        }

        /*
         * Evitamos estados inventados desde frontend.
         */
        if (
            dto.Status != "Disponible" &&
            dto.Status != "Ocupada"
        )
        {
            return BadRequest(
                "Estado de mesa inválido."
            );
        }

        mesa.Number = dto.Number;
        mesa.Status = dto.Status;

        /*
         * RestaurantId NO se modifica.
         */

        await _context.SaveChangesAsync();

        return Ok();
    }

    // ==========================================
    // RESTAURANT ID DESDE JWT
    // ==========================================

    private int ObtenerRestaurantId()
    {
        if (!User.Identity?.IsAuthenticated ?? true)
        {
            throw new UnauthorizedAccessException(
                "El usuario no está autenticado."
            );
        }

        var claimRestaurant =
            User.FindFirst("RestaurantId");

        if (claimRestaurant == null)
        {
            throw new UnauthorizedAccessException(
                "El token no contiene el claim RestaurantId."
            );
        }

        if (!int.TryParse(
            claimRestaurant.Value,
            out var restaurantId))
        {
            throw new Exception(
                $"RestaurantId inválido: {claimRestaurant.Value}"
            );
        }

        return restaurantId;
    }

    [HttpPut("{id}/liberar")]
    [Authorize]
    public async Task<IActionResult> LiberarMesa(int id)
    {
        var restaurantId = ObtenerRestaurantId();

        var mesa = await _context.Mesa
            .FirstOrDefaultAsync(m =>
                m.Id == id &&
                m.RestaurantId == restaurantId);

        if (mesa == null)
        {
            return NotFound(
                "Mesa no encontrada."
            );
        }

        if (mesa.Status == "Disponible")
        {
            return BadRequest(
                "La mesa ya se encuentra disponible."
            );
        }

        mesa.Status = "Disponible";

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mesa.Id,
            mesa.Number,
            mesa.Status
        });
    }
}