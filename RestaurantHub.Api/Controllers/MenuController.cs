using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using Microsoft.EntityFrameworkCore;

using RestaurantHub.Api.Data;

namespace RestaurantHub.Api.Controllers;

[ApiController]

[Route("api/[controller]")]

public class MenuController : ControllerBase

{

    private readonly RestaurantHubContext _context;

    public MenuController(RestaurantHubContext context)

    {

        _context = context;

    }

    [HttpGet("{codigoQr}")]

    public async Task<IActionResult> ObtenerMenu(string codigoQr)

    {

        var mesa = await _context.Mesa

            .Include(m => m.Restaurant)

            .FirstOrDefaultAsync(m => m.CodigoQR == codigoQr);

        if (mesa == null)

            return NotFound();

        var productos = await _context.Producto
           .Include(p => p.Categoria)
           .Where(p =>
               p.RestaurantId == mesa.RestaurantId &&
               p.Disponible)
           .OrderBy(p => p.Id)
.Select(p => new
{
    p.Id,
    p.Nombre,
    p.Descripcion,
    p.Precio,
    p.ImagenUrl,
    p.CategoriaId,
    p.CategoriaExtrasId,
    CategoriaNombre = p.Categoria != null
        ? p.Categoria.Name
        : null
})
           .ToListAsync();

        return Ok(new

        {

            mesa = new

            {

                mesa.Id,

                mesa.Number

            },

            restaurant = new

            {

                mesa.Restaurant.Id,

                mesa.Restaurant.Name,

                mesa.Restaurant.Description,

                mesa.Restaurant.ImageUrl

            },

            productos

        });

    }

    [HttpGet("publico/restaurante/{restaurantId}")]
    [AllowAnonymous]
    public async Task<IActionResult> ObtenerMenuPublicoRestaurante(
   int restaurantId)
    {
        var restaurant = await _context.Restaurants
            .FirstOrDefaultAsync(r =>
                r.Id == restaurantId &&
                r.Active);
        if (restaurant == null)
        {
            return NotFound(
                "Restaurante no encontrado."
            );
        }
        var productos = await _context.Producto
            .Where(p =>
                p.RestaurantId == restaurantId &&
                p.Disponible)
            .Select(p => new
            {
                id = p.Id,
                nombre = p.Nombre,
                descripcion = p.Descripcion,
                precio = p.Precio,
                categoriaId =
                    p.CategoriaId,
                categoria =
                    p.Categoria != null
                        ? p.Categoria.Name
                        : "",
                categoriaExtrasId =
                    p.CategoriaExtrasId
            })
            .OrderBy(p => p.categoria)
            .ThenBy(p => p.nombre)
            .ToListAsync();
        return Ok(new
        {
            restaurant = new
            {
                id = restaurant.Id,
                name = restaurant.Name,
                phone = restaurant.Phone
            },
            productos
        });
    }

    [HttpGet("restaurant/{restaurantId}")]
    public async Task<IActionResult> ObtenerMenuPublico(int restaurantId)
    {
        var restaurant = await _context.Restaurants
            //api controller 
            .FirstOrDefaultAsync(r => r.Id == restaurantId);
        if (restaurant == null)
            return NotFound();
        var categorias = await _context.Categoria
            .Where(c => c.RestaurantId == restaurantId)
            .OrderBy(c => c.Name)
            .Select(c => new
            {
                c.Id,
                c.Name,
                Productos = c.Productos
                    .Where(p => p.Disponible)
                    .OrderBy(p => p.Nombre)
                    .Select(p => new
                    {
                        p.Id,
                        p.Nombre,
                        p.Descripcion,
                        p.Precio,
                        p.ImagenUrl
                    })
            })
            .ToListAsync();
        return Ok(new
        {
            restaurant = new
            {
                restaurant.Id,
                restaurant.Name,
                restaurant.Description,
                restaurant.ImageUrl
            },
            categorias
        });
    }


}
