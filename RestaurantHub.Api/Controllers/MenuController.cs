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
               CategoriaNombre = p.Categoria.Name
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

    [HttpGet("restaurant/{restaurantId}")]
    public async Task<IActionResult> ObtenerMenuPublico(int restaurantId)
    {
        var restaurant = await _context.Restaurants
            //api controller para obtener el menu de un restaurante por su id
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
