using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using RestaurantHub.Api.Models;
using RestaurantHub.Core.Entities;
namespace RestaurantHub.Api.Data;

public class RestaurantHubContext : DbContext
{
    public RestaurantHubContext(DbContextOptions<RestaurantHubContext> options)
        : base(options)
    {
    }
    public DbSet<Restaurant> Restaurants => Set<Restaurant>();
    public DbSet<Mesa> Mesa { get; set; }

    public DbSet<Categoria> Categoria { get; set; }

    public DbSet<Producto> Producto { get; set; }

    public DbSet<Pedido> Pedidos { get; set; }
    public DbSet<DetallePedido> DetallesPedido { get; set; }

    public DbSet<Usuario> Usuarios { get; set; }

    public DbSet<Cliente> Clientes { get; set; }

}