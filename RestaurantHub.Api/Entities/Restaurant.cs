using RestaurantHub.Api.Models;

namespace RestaurantHub.Core.Entities;

public class Restaurant
{
    public int Id { get; set; }
    public string Name { get; set; } = "";

    public string Description  { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Email { get; set; } = "";
    public string Address { get; set; } = "";
    public bool Active { get; set; } = true;

    public string? ImageUrl { get; set; }

    public List<Mesa> Mesas { get; set; } = new();

    public List<Usuario> Usuarios { get; set; } = new();

    public List<Categoria> Categorias { get; set; } = new();
}