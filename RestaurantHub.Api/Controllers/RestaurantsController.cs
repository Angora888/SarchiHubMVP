using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantHub.Api.Data;
using RestaurantHub.Core.Entities;
namespace RestaurantHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]

public class RestaurantsController : ControllerBase
{
    private readonly RestaurantHubContext _context;
    public RestaurantsController(RestaurantHubContext context)
    {
        _context = context;
    }
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Restaurant>>> GetRestaurants()
    {
        return await _context.Restaurants.ToListAsync();
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<Restaurant>> CreateRestaurant(Restaurant restaurant)
    {
        _context.Restaurants.Add(restaurant);
        await _context.SaveChangesAsync();
        return CreatedAtAction(
            nameof(GetRestaurantById),
            new { id = restaurant.Id },
            restaurant);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Restaurant>> GetRestaurantById(int id)
    {
        var restaurant = await _context.Restaurants.FindAsync(id);
        if (restaurant == null)
        {
            return NotFound();
        }
        return restaurant;
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateRestaurant(int id, Restaurant restaurant)
    {
        if (id != restaurant.Id)
        {
            return BadRequest();
        }
        _context.Entry(restaurant).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!RestaurantExists(id))
                return NotFound();
            throw;
        }
        return NoContent();
    }

    [HttpPut("configuracion/pedidos-online")]
    [Authorize]
    public async Task<IActionResult> ActualizarPedidosOnline(
    [FromBody] ActualizarPedidosOnlineDto dto)
    {
        var restaurantId = ObtenerRestaurantId();

        var restaurant = await _context.Restaurants
            .FirstOrDefaultAsync(r =>
                r.Id == restaurantId);

        if (restaurant == null)
        {
            return NotFound(
                "Restaurante no encontrado."
            );
        }

        restaurant.PermitirPedidosOnline =
            dto.PermitirPedidosOnline;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            restaurant.Id,
            restaurant.PublicId,
            restaurant.Name,
            restaurant.PermitirPedidosOnline
        });
    }

    [HttpGet("configuracion")]
    [Authorize]
    public async Task<IActionResult> ObtenerConfiguracion()
    {
        var restaurantId = ObtenerRestaurantId();

        var restaurant = await _context.Restaurants
            .Where(r => r.Id == restaurantId)
            .Select(r => new
            {
                r.Id,
                r.PublicId,
                r.Name,
                r.PermitirPedidosOnline
            })
            .FirstOrDefaultAsync();

        if (restaurant == null)
        {
            return NotFound(
                "Restaurante no encontrado."
            );
        }

        return Ok(restaurant);
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

    private bool RestaurantExists(int id)
    {
        return _context.Restaurants.Any(e => e.Id == id);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteRestaurant(int id)
    {
        var restaurant = await _context.Restaurants.FindAsync(id);
        if (restaurant == null)
            return NotFound();
        _context.Restaurants.Remove(restaurant);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/image")]
    [Authorize]
    public async Task<IActionResult> UploadImage(
   int id,
   IFormFile file)
    {
        var restaurant = await _context.Restaurants.FindAsync(id);
        if (restaurant == null)
            return NotFound();
        if (file == null || file.Length == 0)
            return BadRequest();
        var folder = Path.Combine(
            Directory.GetCurrentDirectory(),
            "wwwroot",
            "images",
            "restaurants");
        if (!Directory.Exists(folder))
            Directory.CreateDirectory(folder);
        var fileName =
            $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var path = Path.Combine(folder, fileName);
        using var stream = new FileStream(path, FileMode.Create);
        await file.CopyToAsync(stream);
        restaurant.ImageUrl =
            $"images/restaurants/{fileName}";
        await _context.SaveChangesAsync();
        return Ok(restaurant.ImageUrl);
    }
}