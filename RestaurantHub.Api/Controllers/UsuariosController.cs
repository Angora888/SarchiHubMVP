using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantHub.Api.Data;
using RestaurantHub.Api.DTOs;
using RestaurantHub.Api.Models;
namespace RestaurantHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly RestaurantHubContext _context;
    public UsuariosController(RestaurantHubContext context)
    {
        _context = context;
    }
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Usuario>>> GetUsuarios()
    {
        return await _context.Usuarios.ToListAsync();
    }
    [HttpGet("{id}")]
    public async Task<ActionResult<Usuario>> GetUsuario(int id)
    {
        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario == null)
            return NotFound();
        return usuario;
    }
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Usuario>> CrearUsuario(Usuario usuario)
    {
        usuario.Password = BCrypt.Net.BCrypt.HashPassword(usuario.Password);
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetUsuario), new { id = usuario.Id }, usuario);
    }
    //[HttpPut("{id}")]
    //[Authorize(Roles = "Admin")]
    //public async Task<IActionResult> ActualizarUsuario(int id, Usuario usuario)
    //{
    //    if (id != usuario.Id)
    //        return BadRequest();
    //    _context.Entry(usuario).State = EntityState.Modified;
    //    await _context.SaveChangesAsync();
    //    return NoContent();
    //}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> EliminarUsuario(int id)
    {
        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario == null)
            return NotFound();
        _context.Usuarios.Remove(usuario);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ObtenerUsuariosAdmin()
    {
        var usuarios = await _context.Usuarios
            .Include(u => u.Restaurant)
            .OrderBy(u => u.Nombre)
            .Select(u => new
            {
                u.Id,
                u.Nombre,
                u.Correo,
                u.Rol,
                u.RestaurantId,
                Restaurante = u.Restaurant!.Name,
                u.Activo
            })
            .ToListAsync();
        return Ok(usuarios);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ActualizarUsuario(
   int id,
   UsuarioUpdateDto dto)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Id == id);
        if (usuario == null)
            return NotFound();
        usuario.Nombre = dto.Nombre;
        usuario.Correo = dto.Correo;
        usuario.Rol = dto.Rol;
        usuario.RestaurantId = dto.RestaurantId;
        usuario.Activo = dto.Activo;
        await _context.SaveChangesAsync();
        return Ok();
    }
}