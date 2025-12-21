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
    public DbSet<ChatConversation> ChatConversations { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<ChatGroup> ChatGroups { get; set; }
    public DbSet<ChatGroupMember> ChatGroupMembers { get; set; }
    public DbSet<GroupMessage> GroupMessages { get; set; }
    public DbSet<ChatAttachment> ChatAttachments { get; set; }
    
    // Entities GED (transformation)
    public DbSet<Workspace> Workspaces { get; set; }
    public DbSet<WorkspaceUser> WorkspaceUsers { get; set; }
    
    // System settings
    public DbSet<SystemSetting> SystemSettings { get; set; }

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

            // Relation Workspace (nullable - transformation GED)
            entity.HasOne(d => d.Workspace)
                .WithMany(w => w.Projects)
                .HasForeignKey(d => d.WorkspaceId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired(false);

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

        // Configuration Workspace (nouveau - modèle GED)
        modelBuilder.Entity<Workspace>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.LogoUrl).HasMaxLength(500);
            
            entity.HasOne(w => w.Owner)
                .WithMany(u => u.OwnedWorkspaces)
                .HasForeignKey(w => w.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configuration WorkspaceUser (junction table - modèle GED)
        modelBuilder.Entity<WorkspaceUser>(entity =>
        {
            entity.HasKey(e => new { e.WorkspaceId, e.UserId });
            
            entity.HasOne(wu => wu.Workspace)
                .WithMany(w => w.Members)
                .HasForeignKey(wu => wu.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(wu => wu.User)
                .WithMany(u => u.WorkspaceMemberships)
                .HasForeignKey(wu => wu.UserId)
                .OnDelete(DeleteBehavior.Cascade);
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

        // Configuration ChatConversation
        modelBuilder.Entity<ChatConversation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.User1Id, e.User2Id }).IsUnique();
            
            entity.HasOne(c => c.User1)
                .WithMany()
                .HasForeignKey(c => c.User1Id)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(c => c.User2)
                .WithMany()
                .HasForeignKey(c => c.User2Id)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(c => c.Messages)
                .WithOne(m => m.Conversation)
                .HasForeignKey(m => m.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configuration Message
        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ConversationId);
            entity.HasIndex(e => e.SenderId);
            entity.HasIndex(e => e.SentAt);
            entity.Property(e => e.Content).IsRequired().HasMaxLength(5000);

            entity.HasOne(m => m.Conversation)
                .WithMany(c => c.Messages)
                .HasForeignKey(m => m.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configuration ChatAttachment
        modelBuilder.Entity<ChatAttachment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.MessageId);
            entity.HasIndex(e => e.GroupMessageId);
            entity.HasIndex(e => e.UploadedBy);
            entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.FilePath).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.MimeType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.FileType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.HashSHA256).HasMaxLength(64);

            entity.HasOne(a => a.Message)
                .WithMany()
                .HasForeignKey(a => a.MessageId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired(false);

            entity.HasOne(a => a.GroupMessage)
                .WithMany()
                .HasForeignKey(a => a.GroupMessageId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired(false);

            entity.HasOne(a => a.Uploader)
                .WithMany()
                .HasForeignKey(a => a.UploadedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}