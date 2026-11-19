namespace RestaurantHub.Api.BusinessDirectory;

public static class DirectoryPhone
{
    public static string? Normalize(string? number)
    {
        if (string.IsNullOrWhiteSpace(number)) return null;
        var digits = new string(number.Where(char.IsDigit).ToArray());
        if (digits.Length == 11 && digits.StartsWith("506")) digits = digits[3..];
        return digits.Length == 8 ? digits : null;
    }

    // Directory rule: 2454 landlines have calling only.
    public static bool IsLandline2454(string? number)
    {
        if (string.IsNullOrWhiteSpace(number)) return false;
        var digits = new string(number.Where(char.IsDigit).ToArray());
        if (digits.StartsWith("506") && digits.Length == 11) digits = digits[3..];
        return digits.Length == 8 && digits.StartsWith("2454");
    }
}
