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
    public DbSet<DocumentVisualisationLog> DocumentVisualisationLogs { get; set; }
    public DbSet<Salle> Salles { get; set; }
    public DbSet<Audience> Audiences { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<CalendarEvent> CalendarEvents { get; set; }
    public DbSet<Formation> Formations { get; set; }
    public DbSet<FormationParticipation> FormationParticipations { get; set; }
    public DbSet<JugeProfile> JugeProfiles { get; set; }
    public DbSet<PasswordChangeRequest> PasswordChangeRequests { get; set; }
    public DbSet<SmtpConfiguration> SmtpConfigurations { get; set; }
    public DbSet<TypeAffaire> TypeAffaires { get; set; }

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
            entity.Property(e => e.NomComplet).HasMaxLength(200);
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

            // Ajout FK TypeAffaire (navigation explicite)
            entity.HasOne(d => d.TypeAffaire)
                .WithMany()
                .HasForeignKey(d => d.TypeAffaireId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Configuration TypeAffaire
        modelBuilder.Entity<TypeAffaire>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nom).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
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

        // Configuration DocumentVisualisationLog
        modelBuilder.Entity<DocumentVisualisationLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.DateVisualisation);
            entity.HasIndex(e => e.DocumentId);
            entity.HasIndex(e => e.UserId);
            entity.Property(e => e.TypeVisualisation).IsRequired().HasMaxLength(20);

            entity.HasOne(v => v.Document)
                .WithMany()
                .HasForeignKey(v => v.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(v => v.User)
                .WithMany()
                .HasForeignKey(v => v.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configuration Audience
        modelBuilder.Entity<Audience>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.DateAudience);
            entity.HasIndex(e => e.DossierId);
            entity.Property(e => e.Lieu).IsRequired().HasMaxLength(200);

            entity.HasOne(a => a.Dossier)
                .WithMany()
                .HasForeignKey(a => a.DossierId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.CreatedByUser)
                .WithMany()
                .HasForeignKey(a => a.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configuration Salle (corrige la clé étrangère CreatedBy pour éviter la colonne fantôme CreatedByUserId)
        modelBuilder.Entity<Salle>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Nom).IsUnique();
            entity.Property(e => e.Nom).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(200);
            entity.Property(e => e.Capacite).IsRequired();

            // Forcer EF à utiliser la colonne CreatedBy comme FK vers Users et supprimer l'ancien schéma basé sur CreatedByUserId
            entity.HasOne(s => s.CreatedByUser)
                .WithMany()
                .HasForeignKey(s => s.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configuration JugeProfile
        modelBuilder.Entity<JugeProfile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.Property(e => e.Grade).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Specialisations).HasMaxLength(500);

            entity.HasOne(jp => jp.User)
                .WithMany()
                .HasForeignKey(jp => jp.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configuration PasswordChangeRequest
        modelBuilder.Entity<PasswordChangeRequest>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code);
            entity.HasIndex(e => e.UserId);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Method).IsRequired().HasMaxLength(10);

            entity.HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configuration SmtpConfiguration
        modelBuilder.Entity<SmtpConfiguration>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Host).IsRequired().HasMaxLength(255);
            entity.Property(e => e.From).IsRequired().HasMaxLength(255);
            entity.Property(e => e.FromName).HasMaxLength(200);
            entity.Property(e => e.Username).HasMaxLength(255);
            entity.Property(e => e.EncryptedPassword).HasMaxLength(1000);
            entity.Property(e => e.LastTestError).HasMaxLength(2000);
        });
    }
}