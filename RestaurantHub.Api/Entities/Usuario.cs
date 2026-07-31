using RestaurantHub.Core.Entities;

namespace RestaurantHub.Api.Models;

public class Usuario
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Rol { get; set; } = "Mesero";
    public bool Activo { get; set; } = true;
    public int RestaurantId { get; set; }
    public Restaurant? Restaurant { get; set; }
}