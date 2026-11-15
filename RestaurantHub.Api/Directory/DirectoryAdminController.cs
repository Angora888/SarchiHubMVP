using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using RestaurantHub.Api.Data;
using Microsoft.IdentityModel.Tokens;

namespace RestaurantHub.Api.BusinessDirectory;

public sealed class DirectoryAdminLoginRequest
{
    [Required, EmailAddress, StringLength(254)] public string Email { get; set; } = "";
    [Required] public string Password { get; set; } = "";
}
public sealed class DirectoryWhatsAppRequest
{
    [Required, StringLength(40)] public string Number { get; set; } = "";
}
public sealed class DirectoryMoveRequest
{
    [Required] public string Direction { get; set; } = "";
}
public sealed class DirectoryReviewRequest
{
    [Required] public string Status { get; set; } = "";
    [StringLength(500)] public string? Reason { get; set; }
}

[ApiController]
[Route("api/directory/admin")]
public sealed class DirectoryAdminController : ControllerBase
{
    private readonly DirectoryDbContext _db;
    private readonly RestaurantHubContext _sinFilas;
    private readonly IConfiguration _config;
    public DirectoryAdminController(DirectoryDbContext db, RestaurantHubContext sinFilas, IConfiguration config)
    { _db = db; _sinFilas = sinFilas; _config = config; }

    [HttpPost("login")]
    [EnableRateLimiting("directory-admin-login")]
    public async Task<IActionResult> Login([FromBody] DirectoryAdminLoginRequest dto, CancellationToken ct)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
        var account = await _db.AdminAccounts.AsNoTracking()
            .FirstOrDefaultAsync(a => a.Email == email && a.IsActive, ct);
        if (account is null)
            return Unauthorized(new { message = "Credenciales incorrectas." });

        // A directory allowlist is mandatory even for Sin Filas restaurant administrators.
        // Never copy or synchronize passwords from Sin Filas into directory.admin_accounts.
        bool authenticated;
        if (account.AuthProvider == "SinFilas")
        {
            var user = await _sinFilas.Usuarios.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Correo.ToLower() == email && u.Activo, ct);
            authenticated = user is not null &&
                BCrypt.Net.BCrypt.Verify(dto.Password, user.Password);
        }
        else if (account.AuthProvider == "Local")
        {
            authenticated = BCrypt.Net.BCrypt.Verify(dto.Password, account.PasswordHash);
        }
        else
        {
            authenticated = false;
        }
        if (!authenticated)
            return Unauthorized(new { message = "Credenciales incorrectas." });

        var jwt = _config.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));
        var claims = new[] {
            new Claim(ClaimTypes.NameIdentifier, account.Id.ToString()),
            new Claim("directory_admin", "true"),
            new Claim("directory_admin_email", account.Email)
        };
        var expires = DateTime.UtcNow.AddMinutes(30);
        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"], audience: jwt["Audience"], claims: claims,
            expires: expires, signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token), expiresAt = expires });
    }

    [Authorize(Policy = "DirectoryAdmin")]
    [HttpGet("businesses")]
    public async Task<IActionResult> Businesses([FromQuery] string status = "Pending",
        [FromQuery] int page = 1, CancellationToken ct = default)
    {
        if (status is not ("Pending" or "Published" or "Rejected" or "Suspended"))
            return BadRequest(new { message = "Estado inválido." });
        page = Math.Clamp(page, 1, 100000);
        var q = _db.Businesses.AsNoTracking().Where(b => b.Status == status);
        var total = await q.CountAsync(ct);
        var items = await q.OrderBy(b => b.SortOrder == 0 ? int.MaxValue : b.SortOrder).ThenBy(b => b.Name).ThenBy(b => b.Id)
            .Skip((page - 1) * 20).Take(20)
            .Select(b => new { b.Id, b.Name, b.Slug, b.Description, b.District,
                b.Address, b.Phone, b.WhatsApp, b.ContactEmail, b.Website,
                b.Status, b.SortOrder, b.CreatedAt, Category = b.Category.Name })
            .ToListAsync(ct);
        return Ok(new { page, pageSize = 20, total, items });
    }

    [Authorize(Policy = "DirectoryAdmin")]
    [HttpPatch("businesses/{id:int}/whatsapp")]
    public async Task<IActionResult> UpdateWhatsApp(int id, [FromBody] DirectoryWhatsAppRequest request, CancellationToken ct)
    {
        // Require an explicit WhatsApp number; never silently assume a voice phone has WhatsApp.
        var digits = new string(request.Number.Where(char.IsDigit).ToArray());
        if (digits.Length == 8) digits = "506" + digits;
        if (digits.Length < 10 || digits.Length > 15 || digits.All(ch => ch == '0'))
            return BadRequest(new { message = "Ingresá un WhatsApp válido con código de país." });
        var business = await _db.Businesses.FirstOrDefaultAsync(b => b.Id == id, ct);
        if (business is null) return NotFound(new { message = "Negocio no encontrado." });
        business.WhatsApp = digits;
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "WhatsApp actualizado.", whatsApp = digits });
    }

    [Authorize(Policy = "DirectoryAdmin")]
    [HttpPatch("businesses/{id:int}/position")]
    public async Task<IActionResult> MoveBusiness(int id, [FromBody] DirectoryMoveRequest request, CancellationToken ct)
    {
        if (request.Direction is not ("up" or "down"))
            return BadRequest(new { message = "Dirección inválida." });
        await using var tx = await _db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable, ct);
        var businesses = await _db.Businesses.Where(b => b.Status == "Published")
            .OrderBy(b => b.SortOrder == 0 ? int.MaxValue : b.SortOrder)
            .ThenBy(b => b.Name).ThenBy(b => b.Id).ToListAsync(ct);
        var current = businesses.FindIndex(b => b.Id == id);
        if (current < 0) return NotFound(new { message = "Solo se pueden ordenar negocios publicados." });
        var target = current + (request.Direction == "up" ? -1 : 1);
        if (target < 0 || target >= businesses.Count)
            return Conflict(new { message = "El negocio ya está en ese extremo." });
        (businesses[current], businesses[target]) = (businesses[target], businesses[current]);
        for (var i = 0; i < businesses.Count; i++) businesses[i].SortOrder = (i + 1) * 10;
        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return Ok(new { message = "Orden actualizado.", id, position = target + 1 });
    }

    [Authorize(Policy = "DirectoryAdmin")]
    [HttpPatch("businesses/{id:int}/status")]
    public async Task<IActionResult> Review(int id, [FromBody] DirectoryReviewRequest request, CancellationToken ct)
    {
        if (request.Status is not ("Published" or "Rejected" or "Suspended" or "Pending"))
            return BadRequest(new { message = "Estado inválido." });
        var adminIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(adminIdText, out var adminId)) return Unauthorized();
        var admin = await _db.AdminAccounts.FirstOrDefaultAsync(a => a.Id == adminId && a.IsActive, ct);
        if (admin is null) return Unauthorized();
        var business = await _db.Businesses.FirstOrDefaultAsync(b => b.Id == id, ct);
        if (business is null) return NotFound(new { message = "Negocio no encontrado." });
        if (business.Status == request.Status)
            return Conflict(new { message = "El negocio ya tiene ese estado." });
        if (request.Status is "Rejected" or "Suspended" && string.IsNullOrWhiteSpace(request.Reason))
            return BadRequest(new { message = "Indicá el motivo del rechazo o suspensión." });
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        var old = business.Status;
        business.Status = request.Status;
        _db.ModerationEvents.Add(new DirectoryModerationEvent {
            BusinessId = id, AdminId = adminId, PreviousStatus = old,
            NewStatus = request.Status, Reason = request.Reason?.Trim(), CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return Ok(new { message = "Estado actualizado.", status = business.Status });
    }
}
