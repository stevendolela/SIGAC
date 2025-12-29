using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using SIGAC.Core.Entities;
using SIGAC.Core.Enums;

namespace SIGAC.Infrastructure.Data;

/// <summary>
/// Classe pour initialiser la base de données avec des données de test
/// </summary>
public static class DbInitializer
{
    public static async Task Initialize(ApplicationDbContext context)
    {
        // Vérifier si la base est déjà initialisée
        if (context.Users.Any())
        {
            return; // La base contient déjà des données
        }

        // =====================================================
        // CRÉATION DES UTILISATEURS
        // =====================================================
        
        var adminId = Guid.NewGuid();
        var presidentId = Guid.NewGuid();
        var juge1Id = Guid.NewGuid();
        var juge2Id = Guid.NewGuid();
        var juge3Id = Guid.NewGuid();

        var users = new List<User>
        {
            // Administrateur
            new User
            {
                Id = adminId,
                Username = "admin",
                Email = "admin@courconstitutionnelle.cd",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@2024!"),
                Role = UserRole.Admin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },

            // Président de la Cour Constitutionnelle
            new User
            {
                Id = presidentId,
                Username = "president.benoit",
                Email = "president@courconstitutionnelle.cd",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("President@2024!"),
                Role = UserRole.Manager,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },

            // Juges Constitutionnels
            new User
            {
                Id = juge1Id,
                Username = "juge.mbala",
                Email = "mbala@courconstitutionnelle.cd",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Juge@2024!"),
                Role = UserRole.Collaborateur,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },

            new User
            {
                Id = juge2Id,
                Username = "juge.tshisekedi",
                Email = "tshisekedi@courconstitutionnelle.cd",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Juge@2024!"),
                Role = UserRole.Collaborateur,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },

            new User
            {
                Id = juge3Id,
                Username = "juge.kabongo",
                Email = "kabongo@courconstitutionnelle.cd",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Juge@2024!"),
                Role = UserRole.Collaborateur,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            }
        };

        await context.Users.AddRangeAsync(users);
        await context.SaveChangesAsync();

        // =====================================================
        // CRÉATION DES DOSSIERS
        // =====================================================

        // Préparer des TypeAffaires par défaut si absents
        var defaultTypes = new[]
        {
            "Contentieux Électoral",
            "Contrôle de Constitutionnalité",
            "Conflit de Compétence"
        };
        foreach (var nom in defaultTypes)
        {
            if (!await context.TypeAffaires.AnyAsync(t => t.Nom == nom))
            {
                await context.TypeAffaires.AddAsync(new TypeAffaire
                {
                    Id = Guid.NewGuid(),
                    Nom = nom,
                    Description = null,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }
        await context.SaveChangesAsync();

        Guid? typeContentieuxId = (await context.TypeAffaires.FirstOrDefaultAsync(t => t.Nom == "Contentieux Électoral"))?.Id;
        Guid? typeControleId = (await context.TypeAffaires.FirstOrDefaultAsync(t => t.Nom == "Contrôle de Constitutionnalité"))?.Id;
        Guid? typeConflitId = (await context.TypeAffaires.FirstOrDefaultAsync(t => t.Nom == "Conflit de Compétence"))?.Id;

        var dossiers = new List<Dossier>
        {
            // Dossier 1 - Contentieux Électoral
            new Dossier
            {
                Id = Guid.NewGuid(),
                NumeroDossier = "CC-2024-001",
                Titre = "Contentieux électoral - Province du Nord-Kivu",
                TypeAffaireId = typeContentieuxId,
                Demandeur = "Parti Politique ENSEMBLE",
                Defendeur = "Commission Électorale Nationale Indépendante",
                DateDepot = DateTime.UtcNow.AddDays(-10),
                Status = StatusDossier.EnCours,
                Priorite = PrioriteDossier.Haute,
                Resume = "Contestation des résultats des élections législatives",
                RapporteurId = juge1Id,
                CreatedBy = adminId,
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            },

            // Dossier 2 - Contrôle de Constitutionnalité
            new Dossier
            {
                Id = Guid.NewGuid(),
                NumeroDossier = "CC-2024-002",
                Titre = "Contrôle de constitutionnalité - Loi de finances 2025",
                TypeAffaireId = typeControleId,
                Demandeur = "Assemblée Nationale de la RDC",
                DateDepot = DateTime.UtcNow.AddDays(-15),
                Status = StatusDossier.EnValidation,
                Priorite = PrioriteDossier.Urgente,
                Resume = "Contrôle a priori de la conformité de la loi de finances 2025",
                RapporteurId = juge2Id,
                CreatedBy = adminId,
                CreatedAt = DateTime.UtcNow.AddDays(-15)
            },

            // Dossier 3 - Conflit de Compétence
            new Dossier
            {
                Id = Guid.NewGuid(),
                NumeroDossier = "CC-2024-003",
                Titre = "Conflit de compétence - Gouverneur vs Assemblée Provinciale",
                TypeAffaireId = typeConflitId,
                Demandeur = "Gouverneur de la Province de l'Équateur",
                Defendeur = "Assemblée Provinciale de l'Équateur",
                DateDepot = DateTime.UtcNow.AddDays(-3),
                Status = StatusDossier.Nouveau,
                Priorite = PrioriteDossier.Normale,
                Resume = "Conflit relatif à l'adoption du budget provincial",
                CreatedBy = adminId,
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            }
        };

        await context.Dossiers.AddRangeAsync(dossiers);
        await context.SaveChangesAsync();

        Console.WriteLine("✅ Base de données initialisée avec succès!");
        Console.WriteLine($"   - {users.Count} utilisateurs créés");
        Console.WriteLine($"   - {dossiers.Count} dossiers créés");
        Console.WriteLine("\n📌 Comptes de test:");
        Console.WriteLine("   Admin: admin / Admin@2024!");
        Console.WriteLine("   Président: president.benoit / President@2024!");
        Console.WriteLine("   Juge: juge.mbala / Juge@2024!");
    }
}
