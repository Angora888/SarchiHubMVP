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
        var (inicio, fin) = FechaHelper.ObtenerRangoHoyCostaRica();
        var dashboard = new DashboardDto
        {
            Restaurantes = await _context.Restaurants.CountAsync(),
            Mesas = await _context.Mesa.CountAsync(),
            Productos = await _context.Producto.CountAsync(),
            Pedidos = await _context.Pedidos
               .CountAsync(p => p.Fecha >= inicio &&
                                p.Fecha < fin),
            Cocina = await _context.Pedidos
               .CountAsync(p =>
                   p.Fecha >= inicio &&
                   p.Fecha < fin &&
                   (p.Estado == "Pendiente" ||
                    p.Estado == "Preparando")),
            Caja = await _context.Pedidos
               .CountAsync(p =>
                   p.Fecha >= inicio &&
                   p.Fecha < fin &&
                   p.Estado == "Listo"),
            Usuarios = await _context.Usuarios.CountAsync()
        };
        return Ok(dashboard);
    }

    public static class FechaHelper
    {
        public static (DateTime Inicio, DateTime Fin) ObtenerRangoHoyCostaRica()
        {
            var zona = TimeZoneInfo.FindSystemTimeZoneById("Central America Standard Time");
            var hoyCR = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, zona).Date;
            var inicio = TimeZoneInfo.ConvertTimeToUtc(hoyCR, zona);
            var fin = inicio.AddDays(1);
            return (inicio, fin);
        }
    }
}