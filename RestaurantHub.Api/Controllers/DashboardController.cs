using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantHub.Api.Data;
namespace RestaurantHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly RestaurantHubContext _context;
    public DashboardController(RestaurantHubContext context)
    {
        _context = context;
    }
    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        var dashboard = new DashboardDto
        {
            Restaurantes = await _context.Restaurants.CountAsync(),
            Mesas = await _context.Mesa.CountAsync(),
            Productos = await _context.Producto.CountAsync(),
            Pedidos = await _context.Pedidos.CountAsync(),
            Usuarios = await _context.Usuarios.CountAsync()
        };
        return Ok(dashboard);
    }
}