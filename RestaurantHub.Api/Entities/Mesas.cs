using RestaurantHub.Core.Entities;

namespace RestaurantHub.Api.Models;

public class Mesa
{
    public int Id { get; set; }
    public int Number { get; set; }
    public int Capacity { get; set; }
    public string Status { get; set; } = "Disponible";
    public int RestaurantId { get; set; }
    public string? CodigoQR { get; set; }
    public Restaurant? Restaurant { get; set; }
}