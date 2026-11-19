namespace RestaurantHub.Api.BusinessDirectory;

public static class DirectoryPhone
{
    // Do not automatically enable WhatsApp for ordinary Costa Rican 2454 landlines.
    public static bool IsLandline2454(string? number)
    {
        if (string.IsNullOrWhiteSpace(number)) return false;
        var digits = new string(number.Where(char.IsDigit).ToArray());
        if (digits.StartsWith("506") && digits.Length == 11) digits = digits[3..];
        return digits.Length == 8 && digits.StartsWith("2454");
    }
}
