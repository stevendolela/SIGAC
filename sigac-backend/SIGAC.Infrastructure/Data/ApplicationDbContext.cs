using Microsoft.EntityFrameworkCore;
using SIGAC.Core.Entities;

namespace SIGAC.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Dossier> Dossiers { get; set; }
    public DbSet<Document> Documents { get; set; }
    public DbSet<Historique> Historiques { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configuration User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Username).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.NomComplet).IsRequired().HasMaxLength(200);
        });

        // Configuration Dossier
        modelBuilder.Entity<Dossier>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.NumeroDossier).IsUnique();
            entity.Property(e => e.NumeroDossier).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Titre).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Demandeur).IsRequired().HasMaxLength(200);

            entity.HasOne(d => d.Rapporteur)
                .WithMany(u => u.DossiersRapporteur)
                .HasForeignKey(d => d.RapporteurId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(d => d.Documents)
                .WithOne(doc => doc.Dossier)
                .HasForeignKey(doc => doc.DossierId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(d => d.Historiques)
                .WithOne(h => h.Dossier)
                .HasForeignKey(h => h.DossierId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configuration Document
        modelBuilder.Entity<Document>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.NomFichier).IsRequired().HasMaxLength(255);
            entity.Property(e => e.CheminFichier).IsRequired().HasMaxLength(500);
        });

        // Configuration Historique
        modelBuilder.Entity<Historique>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Action).IsRequired().HasMaxLength(200);

            entity.HasOne(h => h.User)
                .WithMany()
                .HasForeignKey(h => h.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configuration AuditLog
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Timestamp);
            entity.HasIndex(e => e.UserId);
            
            entity.HasOne(a => a.User)
                .WithMany(u => u.AuditLogs)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}