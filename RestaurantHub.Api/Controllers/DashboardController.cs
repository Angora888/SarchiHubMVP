using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantHub.Api.Data;
using RestaurantHub.Core.Entities;
using System.Security.Claims;
namespace RestaurantHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize ]
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
        var restaurantId = ObtenerRestaurantId();
        var rol = User.FindFirst(ClaimTypes.Role)?.Value;
        var esAdmin = rol == "Admin";
        var dashboard = new DashboardDto
        {
            Restaurantes = await _context.Restaurants.CountAsync(),
            Categorias = esAdmin
                ? await _context.Categoria.CountAsync()
                : await _context.Categoria.CountAsync(
                    c => c.RestaurantId == restaurantId),
            Mesas = esAdmin
                ? await _context.Mesa.CountAsync()
                : await _context.Mesa.CountAsync(
                    m => m.RestaurantId == restaurantId),
            Productos = esAdmin
                ? await _context.Producto.CountAsync()
                : await _context.Producto.CountAsync(
                    p => p.RestaurantId == restaurantId),
            Usuarios = esAdmin
                ? await _context.Usuarios.CountAsync()
                : await _context.Usuarios.CountAsync(
                    u => u.RestaurantId == restaurantId),
            Pedidos = esAdmin
                ? await _context.Pedidos.CountAsync(p =>
                    p.Fecha >= inicio &&
                    p.Fecha < fin)
                : await _context.Pedidos.CountAsync(p =>
                    p.RestaurantId == restaurantId &&
                    p.Fecha >= inicio &&
                    p.Fecha < fin),
            Cocina = esAdmin
                ? await _context.Pedidos.CountAsync(p =>
                    p.Fecha >= inicio &&
                    p.Fecha < fin &&
                    (p.Estado == "Pendiente" ||
                     p.Estado == "Preparando"))
                : await _context.Pedidos.CountAsync(p =>
                    p.RestaurantId == restaurantId &&
                    p.Fecha >= inicio &&
                    p.Fecha < fin &&
                    (p.Estado == "Pendiente" ||
                     p.Estado == "Preparando")),
            Caja = esAdmin
                ? await _context.Pedidos.CountAsync(p =>
                    p.Fecha >= inicio &&
                    p.Fecha < fin &&
                    p.Estado == "Listo")
                : await _context.Pedidos.CountAsync(p =>
                    p.RestaurantId == restaurantId &&
                    p.Fecha >= inicio &&
                    p.Fecha < fin &&
                    p.Estado == "Listo")
        };
        return Ok(dashboard);
    }

    public static class FechaHelper
    {
        private static TimeZoneInfo ObtenerZonaCostaRica()
        {
            // Azure/Linux
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(
                    "America/Costa_Rica"
                );
            }
            catch
            {
                // Windows
                return TimeZoneInfo.FindSystemTimeZoneById(
                    "Central America Standard Time"
                );
            }
        }
        public static (DateTime inicio, DateTime fin)
            ObtenerRangoFechaCostaRica(DateOnly fecha)
        {
            var zonaCostaRica =
                ObtenerZonaCostaRica();
            // 00:00 del día seleccionado
            // SIN zona horaria todavía
            var inicioLocal =
                DateTime.SpecifyKind(
                    fecha.ToDateTime(
                        TimeOnly.MinValue
                    ),
                    DateTimeKind.Unspecified
                );
            // 00:00 del día siguiente
            var finLocal =
                DateTime.SpecifyKind(
                    inicioLocal.AddDays(1),
                    DateTimeKind.Unspecified
                );
            // Convertimos EXPLÍCITAMENTE
            // Costa Rica -> UTC
            var inicioUtc =
                TimeZoneInfo.ConvertTimeToUtc(
                    inicioLocal,
                    zonaCostaRica
                );
            var finUtc =
                TimeZoneInfo.ConvertTimeToUtc(
                    finLocal,
                    zonaCostaRica
                );
            return (
                inicioUtc,
                finUtc
            );
        }
        public static (DateTime inicio, DateTime fin)
            ObtenerRangoHoyCostaRica()
        {
            var zonaCostaRica =
                ObtenerZonaCostaRica();
            var ahoraCostaRica =
                TimeZoneInfo.ConvertTimeFromUtc(
                    DateTime.UtcNow,
                    zonaCostaRica
                );
            var fecha =
                DateOnly.FromDateTime(
                    ahoraCostaRica
                );
            return ObtenerRangoFechaCostaRica(
                fecha
            );
        }
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