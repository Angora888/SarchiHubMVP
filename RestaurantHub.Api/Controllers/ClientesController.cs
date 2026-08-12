using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantHub.Api.Data;
namespace RestaurantHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientesController : ControllerBase
{
    private readonly RestaurantHubContext _context;
    public ClientesController(RestaurantHubContext context)
    {
        _context = context;
    }

    [HttpGet("telefono/{telefono}")]
    [Authorize]
    public async Task<IActionResult> BuscarPorTelefono(string telefono)
    {
        var restaurantId = ObtenerRestaurantId();

        var cliente = await _context.Clientes
            .FirstOrDefaultAsync(c =>
                c.Telefono == telefono &&
                c.RestaurantId == restaurantId);

        if (cliente == null)
            return NotFound();

        return Ok(cliente);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CrearCliente(Cliente cliente)
    {
        var restaurantId = ObtenerRestaurantId();

        // Validar teléfono
        if (string.IsNullOrWhiteSpace(cliente.Telefono))
        {
            return BadRequest("El teléfono es obligatorio.");
        }

        // Validar nombre
        if (string.IsNullOrWhiteSpace(cliente.NombreCompleto))
        {
            return BadRequest("El nombre es obligatorio.");
        }

        // Validar dirección
        if (string.IsNullOrWhiteSpace(cliente.Direccion))
        {
            return BadRequest("La dirección es obligatoria.");
        }

        // Verificar si ya existe dentro del mismo restaurante
        var existe = await _context.Clientes
            .AnyAsync(c =>
                c.Telefono == cliente.Telefono &&
                c.RestaurantId == restaurantId);

        if (existe)
        {
            return BadRequest("Ya existe un cliente con ese número de teléfono en este restaurante.");
        }

        // El RestaurantId siempre se toma del JWT
        // Ignoramos cualquier RestaurantId que venga desde React/Postman
        cliente.RestaurantId = restaurantId;

        // Fecha de registro
        cliente.FechaRegistro = DateTime.UtcNow;

        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();

        return Ok(cliente);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> EditarCliente(int id, Cliente cliente)
    {
        var restaurantId = ObtenerRestaurantId();

        if (id != cliente.Id)
            return BadRequest("El Id no coincide.");

        // Buscar solamente dentro del restaurante autenticado
        var clienteDb = await _context.Clientes
            .FirstOrDefaultAsync(c =>
                c.Id == id &&
                c.RestaurantId == restaurantId);

        if (clienteDb == null)
            return NotFound("Cliente no encontrado.");

        // Verificar que el teléfono no pertenezca
        // a otro cliente del mismo restaurante
        var telefonoExiste = await _context.Clientes
            .AnyAsync(c =>
                c.Telefono == cliente.Telefono &&
                c.RestaurantId == restaurantId &&
                c.Id != id);

        if (telefonoExiste)
            return BadRequest(
                "Ya existe otro cliente con ese número de teléfono en este restaurante.");

        clienteDb.NombreCompleto = cliente.NombreCompleto;
        clienteDb.Telefono = cliente.Telefono;
        clienteDb.Direccion = cliente.Direccion;
        clienteDb.Latitud = cliente.Latitud;
        clienteDb.Longitud = cliente.Longitud;

        // NO modificamos RestaurantId.
        // Se mantiene el restaurante original del cliente.

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje = "Cliente actualizado correctamente.",
            cliente = clienteDb
        });
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> EliminarCliente(int id)
    {
        var restaurantId = ObtenerRestaurantId();

        var cliente = await _context.Clientes
            .FirstOrDefaultAsync(c =>
                c.Id == id &&
                c.RestaurantId == restaurantId);

        if (cliente == null)
            return NotFound("Cliente no encontrado.");

        _context.Clientes.Remove(cliente);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje = "Cliente eliminado correctamente."
        });
    }


    [HttpGet("cliente/{telefono}")]
    [Authorize]
    public async Task<IActionResult> BuscarCliente(string telefono)
    {
        var restaurantId = ObtenerRestaurantId();

        var cliente = await _context.Clientes
            .FirstOrDefaultAsync(c =>
                c.Telefono == telefono &&
                c.RestaurantId == restaurantId);

        if (cliente == null)
            return NotFound();

        return Ok(cliente);
    }

    [HttpPost("cliente")]
    [Authorize]
    public async Task<IActionResult> CrearClienteAdmin(Cliente cliente)
    {
        var restaurantId = ObtenerRestaurantId();

        var existente = await _context.Clientes
            .FirstOrDefaultAsync(c =>
                c.Telefono == cliente.Telefono &&
                c.RestaurantId == restaurantId);

        if (existente != null)
            return Ok(existente);

        cliente.RestaurantId = restaurantId;
        cliente.FechaRegistro = DateTime.UtcNow;

        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();

        return Ok(cliente);
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> ObtenerClientes()
    {
        var restaurantId = ObtenerRestaurantId();

        var clientes = await _context.Clientes
            .Where(c => c.RestaurantId == restaurantId)
            .OrderBy(c => c.NombreCompleto)
            .ToListAsync();

        return Ok(clientes);
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
            throw new UnauthorizedAccessException(
                "El RestaurantId del token no es válido.");
        }
        return restaurantId;
    }
}