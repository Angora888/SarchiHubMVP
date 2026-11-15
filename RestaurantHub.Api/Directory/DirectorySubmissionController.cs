using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace RestaurantHub.Api.BusinessDirectory;

public sealed class DirectorySubmissionRequest
{
    [Required, StringLength(180, MinimumLength = 3)] public string Name { get; set; } = "";
    [Required, Range(1, int.MaxValue)] public int CategoryId { get; set; }
    [Required, StringLength(80)] public string District { get; set; } = "";
    [StringLength(1000)] public string? Description { get; set; }
    [StringLength(250)] public string? Address { get; set; }
    [Phone, StringLength(40)] public string? Phone { get; set; }
    [Phone, StringLength(40)] public string? WhatsApp { get; set; }
    [Required, EmailAddress, StringLength(254)] public string ContactEmail { get; set; } = "";
    [Url, StringLength(500)] public string? Website { get; set; }
}

[ApiController]
[Route("api/directory/submissions")]
public sealed class DirectorySubmissionController : ControllerBase
{
    private static readonly string[] Districts = ["Sarchí Norte", "Sarchí Sur", "Toro Amarillo", "San Pedro", "Rodríguez"];
    private readonly DirectoryDbContext _db;
    public DirectorySubmissionController(DirectoryDbContext db) => _db = db;

    [HttpPost]
    [EnableRateLimiting("directory-submissions")]
    public async Task<IActionResult> Submit([FromBody] DirectorySubmissionRequest request, CancellationToken ct)
    {
        var district = Districts.FirstOrDefault(d => string.Equals(d, request.District?.Trim(), StringComparison.OrdinalIgnoreCase));
        if (district is null) return BadRequest(new { message = "Seleccioná un distrito válido de Sarchí." });
        var categoryExists = await _db.Categories.AnyAsync(c => c.Id == request.CategoryId, ct);
        if (!categoryExists) return BadRequest(new { message = "La categoría seleccionada no existe." });

        var name = request.Name.Trim();
        if (name.Length < 3) return BadRequest(new { message = "El nombre debe tener al menos tres caracteres." });
        var normalized = name.Normalize(NormalizationForm.FormD);
        var slugBase = Regex.Replace(
            new string(normalized.Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark).ToArray())
                .ToLowerInvariant(), "[^a-z0-9]+", "-").Trim('-');
        if (string.IsNullOrEmpty(slugBase)) return BadRequest(new { message = "El nombre debe incluir letras o números." });
        // Slug is only an internal unique URL, never a proof of business identity.
        var slug = slugBase[..Math.Min(slugBase.Length, 125)] + "-" + Guid.NewGuid().ToString("N")[..10];
        _db.Businesses.Add(new DirectoryBusiness {
            Name = name, Slug = slug, CategoryId = request.CategoryId, District = district,
            Description = request.Description?.Trim(), Address = request.Address?.Trim(),
            Phone = request.Phone?.Trim(), WhatsApp = request.WhatsApp?.Trim(),
            Website = request.Website?.Trim(), ContactEmail = request.ContactEmail.Trim(),
            Status = "Pending", CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(ct);
        // No internal ID or private contact email is exposed in the public response.
        return Accepted(new { message = "Recibimos tu solicitud. El negocio se publicará solo después de la revisión administrativa." });
    }
}
