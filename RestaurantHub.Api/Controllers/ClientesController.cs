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
    public async Task<IActionResult> BuscarPorTelefono(string telefono)
    {
        var cliente = await _context.Clientes
            .FirstOrDefaultAsync(c => c.Telefono == telefono);
        if (cliente == null)
            return NotFound();
        return Ok(cliente);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CrearCliente(Cliente cliente)
    {
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
        // Verificar si ya existe
        var existe = await _context.Clientes
            .AnyAsync(c => c.Telefono == cliente.Telefono);
        if (existe)
        {
            return BadRequest("Ya existe un cliente con ese número de teléfono.");
        }
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
        if (id != cliente.Id)
            return BadRequest("El Id no coincide.");
        var clienteDb = await _context.Clientes.FindAsync(id);
        if (clienteDb == null)
            return NotFound("Cliente no encontrado.");
        // Verificar que el teléfono no pertenezca a otro cliente
        var telefonoExiste = await _context.Clientes
            .AnyAsync(c => c.Telefono == cliente.Telefono && c.Id != id);
        if (telefonoExiste)
            return BadRequest("Ya existe otro cliente con ese número de teléfono.");
        clienteDb.NombreCompleto = cliente.NombreCompleto;
        clienteDb.Telefono = cliente.Telefono;
        clienteDb.Direccion = cliente.Direccion;
        clienteDb.Latitud = cliente.Latitud;
        clienteDb.Longitud = cliente.Longitud;
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
        var cliente = await _context.Clientes.FindAsync(id);
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
        var cliente = await _context.Clientes
            .FirstOrDefaultAsync(c => c.Telefono == telefono);
        if (cliente == null)
            return NotFound();
        return Ok(cliente);
    }

    [HttpPost("cliente")]
    [Authorize]
    public async Task<IActionResult> CrearClienteAdmin(Cliente cliente)
    {
        var existente = await _context.Clientes
            .FirstOrDefaultAsync(c => c.Telefono == cliente.Telefono);
        if (existente != null)
            return Ok(existente);
        cliente.FechaRegistro = DateTime.UtcNow;
        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();
        return Ok(cliente);
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerClientes()
    {
        var clientes = await _context.Clientes
            .OrderBy(c => c.NombreCompleto)
            .ToListAsync();
        return Ok(clientes);
    }
}