using Microsoft.EntityFrameworkCore;

namespace RestaurantHub.Api.BusinessDirectory;

// Separate context/schema avoids modifying existing Sin Filas tables or migrations.
public sealed class DirectoryDbContext : DbContext
{
    public DirectoryDbContext(DbContextOptions<DirectoryDbContext> options) : base(options) { }
    public DbSet<DirectoryBusiness> Businesses => Set<DirectoryBusiness>();
    public DbSet<DirectoryCategory> Categories => Set<DirectoryCategory>();
    public DbSet<DirectoryAdminAccount> AdminAccounts => Set<DirectoryAdminAccount>();
    public DbSet<DirectoryModerationEvent> ModerationEvents => Set<DirectoryModerationEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<DirectoryAdminAccount>(entity =>
        {
            entity.ToTable("admin_accounts", "directory");
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Id).HasColumnName("id");
            entity.Property(a => a.Email).HasColumnName("email").HasMaxLength(254).IsRequired();
            entity.HasIndex(a => a.Email).IsUnique();
            entity.Property(a => a.PasswordHash).HasColumnName("password_hash").IsRequired();
            entity.Property(a => a.AuthProvider).HasColumnName("auth_provider").HasMaxLength(20).IsRequired();
            entity.Property(a => a.IsActive).HasColumnName("is_active");
        });
        modelBuilder.Entity<DirectoryModerationEvent>(entity =>
        {
            entity.ToTable("moderation_events", "directory");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BusinessId).HasColumnName("business_id");
            entity.Property(e => e.AdminId).HasColumnName("admin_id");
            entity.Property(e => e.PreviousStatus).HasColumnName("previous_status").HasMaxLength(20);
            entity.Property(e => e.NewStatus).HasColumnName("new_status").HasMaxLength(20);
            entity.Property(e => e.Reason).HasColumnName("reason").HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.HasOne<DirectoryBusiness>().WithMany().HasForeignKey(e => e.BusinessId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<DirectoryAdminAccount>().WithMany().HasForeignKey(e => e.AdminId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<DirectoryCategory>(entity =>
        {
            entity.ToTable("categories", "directory");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(120).IsRequired();
            entity.Property(x => x.Slug).HasColumnName("slug").HasMaxLength(120).IsRequired();
            entity.HasIndex(x => x.Slug).IsUnique();
        });
        modelBuilder.Entity<DirectoryBusiness>(entity =>
        {
            entity.ToTable("businesses", "directory");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.Slug).HasColumnName("slug").HasMaxLength(180).IsRequired();
            entity.HasIndex(x => x.Slug).IsUnique();
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(180).IsRequired();
            entity.Property(x => x.Description).HasColumnName("description");
            entity.Property(x => x.CategoryId).HasColumnName("category_id");
            entity.Property(x => x.District).HasColumnName("district").HasMaxLength(80).IsRequired();
            entity.Property(x => x.Address).HasColumnName("address");
            entity.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(40);
            entity.Property(x => x.WhatsApp).HasColumnName("whatsapp").HasMaxLength(40);
            entity.Property(x => x.ContactEmail).HasColumnName("contact_email").HasMaxLength(254);
            entity.Property(x => x.Website).HasColumnName("website").HasMaxLength(500);
            entity.Property(x => x.ImageUrl).HasColumnName("image_url").HasMaxLength(500);
            entity.Property(x => x.Status).HasColumnName("status").HasMaxLength(20).IsRequired();
            entity.Property(x => x.SortOrder).HasColumnName("sort_order").HasDefaultValue(0);
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(x => new { x.Status, x.District });
        });
    }
}
