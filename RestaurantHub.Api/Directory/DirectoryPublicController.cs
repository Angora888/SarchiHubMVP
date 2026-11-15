using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace RestaurantHub.Api.BusinessDirectory;

[ApiController]
[Route("api/directory")]
public sealed class DirectoryPublicController : ControllerBase
{
    private readonly DirectoryDbContext _db;
    public DirectoryPublicController(DirectoryDbContext db) => _db = db;

    [HttpGet("categories")]
    public async Task<IActionResult> Categories(CancellationToken ct)
    {
        var categories = await _db.Categories.AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new { c.Id, c.Slug, c.Name })
            .ToListAsync(ct);
        return Ok(categories);
    }

    [HttpGet("businesses")]
    public async Task<IActionResult> Businesses(
        [FromQuery] string? search,
        [FromQuery] string? district,
        [FromQuery] int? categoryId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var query = _db.Businesses.AsNoTracking().Where(b => b.Status == "Published");
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            if (term.Length > 100) return BadRequest("Search must be 100 characters or fewer.");
            var escapedTerm = term.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
            var pattern = $"%{escapedTerm}%";
            query = query.Where(b => EF.Functions.ILike(b.Name, pattern, "\\") ||
                                     (b.Description != null && EF.Functions.ILike(b.Description, pattern, "\\")));
        }
        if (!string.IsNullOrWhiteSpace(district))
            query = query.Where(b => b.District == district.Trim());
        if (categoryId.HasValue)
            query = query.Where(b => b.CategoryId == categoryId.Value);

        var total = await query.CountAsync(ct);
        var results = await query.OrderBy(b => b.Name).ThenBy(b => b.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(b => new {
                b.Id, b.Slug, b.Name, b.Description, b.District,
                b.Address, b.Phone, b.WhatsApp, b.Website, b.ImageUrl,
                Category = new { b.Category.Id, b.Category.Name, b.Category.Slug }
            }).ToListAsync(ct);
        return Ok(new { page, pageSize, total, items = results });
    }

    [HttpGet("businesses/{slug}")]
    public async Task<IActionResult> Business(string slug, CancellationToken ct)
    {
        var business = await _db.Businesses.AsNoTracking()
            .Where(b => b.Status == "Published" && b.Slug == slug)
            .Select(b => new {
                b.Id, b.Slug, b.Name, b.Description, b.District,
                b.Address, b.Phone, b.WhatsApp, b.Website, b.ImageUrl,
                Category = new { b.Category.Id, b.Category.Name, b.Category.Slug }
            }).FirstOrDefaultAsync(ct);
        return business is null ? NotFound() : Ok(business);
    }
}
