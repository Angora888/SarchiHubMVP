using System.Collections.Concurrent;
using System.Globalization;
using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace RestaurantHub.Api.BusinessDirectory;

// Google Maps short links need server-side expansion: browsers cannot read their cross-origin redirects.
public static class DirectoryMapCoordinates
{
    private static readonly HttpClient Http = new(new HttpClientHandler { AllowAutoRedirect = false, UseCookies = false })
    { Timeout = TimeSpan.FromSeconds(5) };
    private static readonly ConcurrentDictionary<string, (double[]? Point, DateTime Expires)> Cache = new();
    private static readonly Regex Pair = new(@"(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)", RegexOptions.Compiled);
    private static readonly Regex Embedded = new(@"!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)", RegexOptions.Compiled);

    public static double[]? Parse(string? value)
    {
        if (!DirectoryMaps.IsValid(value) || string.IsNullOrWhiteSpace(value)) return null;
        var uri = new Uri(value);
        var decoded = Uri.UnescapeDataString(uri.ToString());
        // Embedded Google place coordinates are preferred to the map viewport center.
        var place = Embedded.Match(decoded);
        if (place.Success) return Point(place.Groups[1].Value, place.Groups[2].Value);
        foreach (var param in new[] { "query", "q", "ll" })
        {
            var match = Regex.Match(decoded, @"[?&]" + param + @"=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)", RegexOptions.IgnoreCase);
            if (match.Success) return Point(match.Groups[1].Value, match.Groups[2].Value);
        }
        var at = Regex.Match(decoded, @"@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)");
        return at.Success ? Point(at.Groups[1].Value, at.Groups[2].Value) : null;
    }
    private static double[]? Point(string lat, string lon)
    {
        if (!double.TryParse(lat, NumberStyles.Float, CultureInfo.InvariantCulture, out var a) ||
            !double.TryParse(lon, NumberStyles.Float, CultureInfo.InvariantCulture, out var b) ||
            a is < -90 or > 90 || b is < -180 or > 180) return null;
        return [a, b];
    }

    public static async Task<double[]?> Resolve(string? url, CancellationToken ct)
    {
        var found = Parse(url);
        if (found is not null || string.IsNullOrWhiteSpace(url) || !DirectoryMaps.IsValid(url)) return found;
        if (Cache.TryGetValue(url, out var cached) && cached.Expires > DateTime.UtcNow) return cached.Point;
        var current = new Uri(url);
        // Only follow an HTTPS redirect to known Google Maps hosts, never arbitrary destinations.
        try
        {
            for (var i = 0; i < 5; i++)
            {
                if (!DirectoryMaps.IsValid(current.ToString())) break;
                using var req = new HttpRequestMessage(HttpMethod.Get, current);
                using var res = await Http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);
                if (res.StatusCode is not (HttpStatusCode.MovedPermanently or HttpStatusCode.Redirect
                    or HttpStatusCode.SeeOther or HttpStatusCode.TemporaryRedirect or HttpStatusCode.PermanentRedirect)) break;
                if (res.Headers.Location is null) break;
                current = res.Headers.Location.IsAbsoluteUri ? res.Headers.Location : new Uri(current, res.Headers.Location);
                if (!DirectoryMaps.IsValid(current.ToString())) break;
                found = Parse(current.ToString());
                if (found is not null) break;
            }
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException) { /* An unresolved URL stays unpinned. */ }
        Cache[url] = (found, DateTime.UtcNow.AddMinutes(found is null ? 15 : 360));
        return found;
    }
}

[ApiController]
[Route("api/directory/map-coordinates")]
public sealed class DirectoryMapCoordinatesController : ControllerBase
{
    private readonly DirectoryDbContext _db;
    public DirectoryMapCoordinatesController(DirectoryDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var links = await _db.Businesses.AsNoTracking().Where(b => b.Status == "Published" && b.MapsUrl != null)
            .Select(b => new { b.Id, b.MapsUrl }).ToListAsync(ct);
        using var limiter = new SemaphoreSlim(6);
        var locations = await Task.WhenAll(links.Select(async b =>
        {
            await limiter.WaitAsync(ct);
            try { return new { b.Id, Coordinates = await DirectoryMapCoordinates.Resolve(b.MapsUrl, ct) }; }
            finally { limiter.Release(); }
        }));
        return Ok(locations.Where(l => l.Coordinates is not null));
    }
}
