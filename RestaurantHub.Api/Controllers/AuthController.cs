using Microsoft.AspNetCore.Mvc;
using RestaurantHub.Api.Data;
using RestaurantHub.Api.DTOs;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace RestaurantHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly RestaurantHubContext _context;
    public AuthController(RestaurantHubContext context)
    {
        _context = context;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        Console.Write("Entro al login");
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Correo == dto.Correo);
        if (usuario == null)
            return Unauthorized("Correo o contraseña incorrectos.");
        if (!BCrypt.Net.BCrypt.Verify(dto.Password, usuario.Password))
            return Unauthorized("Correo o contraseña incorrectos.");
        var jwt = HttpContext.RequestServices
            .GetRequiredService<IConfiguration>()
            .GetSection("Jwt");
        var claims = new[]
        {
       new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
       new Claim(ClaimTypes.Name, usuario.Nombre),
       new Claim(ClaimTypes.Role, usuario.Rol),
       new Claim("RestaurantId", usuario.RestaurantId.ToString())
   };
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwt["Key"]!));
        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: DateTime.Now.AddMinutes(
                Convert.ToDouble(jwt["ExpireMinutes"])),
            signingCredentials: credentials);
        return Ok(new
        {
            token = new JwtSecurityTokenHandler().WriteToken(token),
            usuario = usuario.Nombre,
            rol = usuario.Rol
        });
    }
}