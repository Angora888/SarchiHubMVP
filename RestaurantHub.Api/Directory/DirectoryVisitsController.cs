using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace RestaurantHub.Api.BusinessDirectory;

[ApiController]
[Route("api/directory/visits")]
public sealed class DirectoryVisitsController : ControllerBase
{
    private readonly DirectoryDbContext _db;
    public DirectoryVisitsController(DirectoryDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var count = await _db.Database.SqlQueryRaw<long>(
            "SELECT total_visits AS \"Value\" FROM directory.visit_counter WHERE id = 1"
        ).SingleAsync(ct);
        Response.Headers.CacheControl = "no-store";
        return Ok(new { totalVisits = count });
    }

    [HttpPost]
    [EnableRateLimiting("directory-visits")]
    public async Task<IActionResult> Register(CancellationToken ct)
    {
        // Atomic increment. The frontend sends at most once per browser session.
        // This is an approximate session-visit counter, not unique people.
        var count = await _db.Database.SqlQueryRaw<long>(
            "WITH updated AS (UPDATE directory.visit_counter SET total_visits = total_visits + 1 WHERE id = 1 RETURNING total_visits) SELECT total_visits AS \"Value\" FROM updated"
        ).SingleAsync(ct);
        Response.Headers.CacheControl = "no-store";
        return Ok(new { totalVisits = count });
    }
}
