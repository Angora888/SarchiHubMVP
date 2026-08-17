using Microsoft.EntityFrameworkCore;
using RestaurantHub.Api.Models;
using RestaurantHub.Core.Entities;

namespace RestaurantHub.Api.Data;

public class RestaurantHubContext : DbContext
{
    public RestaurantHubContext(
        DbContextOptions<RestaurantHubContext> options)
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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // =========================================================
        // RESTAURANT
        // =========================================================

        modelBuilder.Entity<Restaurant>()
            .Property(r => r.PublicId)
            .HasMaxLength(100);

        modelBuilder.Entity<Restaurant>()
            .Property(r => r.PermitirPedidosOnline)
            .HasDefaultValue(true);

        // =========================================================
        // PRODUCTO
        // =========================================================

        // Categoría principal del producto
        modelBuilder.Entity<Producto>()
            .HasOne(p => p.Categoria)
            .WithMany(c => c.Productos)
            .HasForeignKey(p => p.CategoriaId)
            .OnDelete(DeleteBehavior.Restrict);

        // Categoría que contiene los extras disponibles para el producto
        modelBuilder.Entity<Producto>()
            .HasOne(p => p.CategoriaExtras)
            .WithMany()
            .HasForeignKey(p => p.CategoriaExtrasId)
            .OnDelete(DeleteBehavior.SetNull);

        // =========================================================
        // DETALLE PEDIDO
        // =========================================================

        // Relación padre/hijo entre detalles del pedido
        modelBuilder.Entity<DetallePedido>()
            .HasOne(d => d.DetallePadre)
            .WithMany(d => d.Extras)
            .HasForeignKey(d => d.DetallePadreId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}