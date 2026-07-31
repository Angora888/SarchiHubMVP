using RestaurantHub.Core.Entities;

namespace RestaurantHub.Api.Models;

public class Producto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public decimal Precio { get; set; }
    public bool Disponible { get; set; } = true;
    public string? ImagenUrl { get; set; }
    public int CategoriaId { get; set; }
    public Categoria? Categoria { get; set; }
    public int RestaurantId { get; set; }
    public Restaurant? Restaurant { get; set; }
}