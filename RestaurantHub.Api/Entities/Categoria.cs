using RestaurantHub.Api.Models;

namespace RestaurantHub.Core.Entities;

public class Categoria
{
   public int Id { get; set; }
   public string Name { get; set; } = "";
   public int RestaurantId { get; set; }
   public Restaurant? Restaurant { get; set; }
   public List<Producto> Productos { get; set; } = new();
}