namespace RestaurantHub.Api.Directory;

public sealed class DirectoryBusiness
{
    public int Id { get; set; }
    public string Slug { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public int CategoryId { get; set; }
    public DirectoryCategory Category { get; set; } = null!;
    public string District { get; set; } = "";
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? WhatsApp { get; set; }
    public string? Website { get; set; }
    public string? ImageUrl { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
public sealed class DirectoryCategory
{
    public int Id { get; set; }
    public string Slug { get; set; } = "";
    public string Name { get; set; } = "";
}
