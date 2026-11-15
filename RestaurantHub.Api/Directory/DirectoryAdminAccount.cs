namespace RestaurantHub.Api.BusinessDirectory;

// Accounts dedicated to the directory; never reuse restaurant Admin roles.
public sealed class DirectoryAdminAccount
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string AuthProvider { get; set; } = "Local";
    public bool IsActive { get; set; } = true;
}
public sealed class DirectoryModerationEvent
{
    public long Id { get; set; }
    public int BusinessId { get; set; }
    public int AdminId { get; set; }
    public string PreviousStatus { get; set; } = "";
    public string NewStatus { get; set; } = "";
    public string? Reason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
