using Microsoft.EntityFrameworkCore;
using RestaurantHub.Core.Entities;

[Index(nameof(RestaurantId), nameof(Telefono), IsUnique = true)]
public class Cliente
{
    public int Id { get; set; }
    public string Telefono { get; set; } = "";
    public string NombreCompleto { get; set; } = "";
    public string Direccion { get; set; } = "";
    public double? Latitud { get; set; }
    public double? Longitud { get; set; }
    public DateTime FechaRegistro { get; set; } = DateTime.Now;

    public int RestaurantId { get; set; }
    public Restaurant? Restaurant { get; set; } = null!;
}