namespace RestaurantHub.Api.BusinessDirectory;

public static class DirectoryMaps
{
    public static string? Normalize(string? url) => string.IsNullOrWhiteSpace(url) ? null : url.Trim();
    public static bool IsValid(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return true;
        if (url.Length > 1000 || !Uri.TryCreate(url.Trim(), UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps || !string.IsNullOrEmpty(uri.UserInfo)) return false;
        var host = uri.IdnHost.ToLowerInvariant();
        return host == "maps.app.goo.gl" || (host == "goo.gl" && uri.AbsolutePath.StartsWith("/maps/", StringComparison.OrdinalIgnoreCase))
            || (host == "google.com" || host.EndsWith(".google.com", StringComparison.Ordinal)) && uri.AbsolutePath.StartsWith("/maps", StringComparison.OrdinalIgnoreCase);
    }
}
