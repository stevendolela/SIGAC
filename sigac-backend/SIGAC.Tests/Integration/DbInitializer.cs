using SIGAC.Core.Entities;
using SIGAC.Core.Enums;
using SIGAC.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace SIGAC.Tests.Integration;

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
        
        var adminId = Guid.Parse("10000000-0000-0000-0000-000000000001");
        var presidentId = Guid.NewGuid();
        var juge1Id = Guid.NewGuid();
        var juge2Id = Guid.NewGuid();
        var juge3Id = Guid.NewGuid();
        var greffierId = Guid.NewGuid();
        var greffierAdjId = Guid.NewGuid();
        var consultantId = Guid.NewGuid();

        var users = new List<User>
        {
            // Administrateur
            new User
            {
                Id = adminId,
                Username = "admin",
                Email = "admin@courconstitutionnelle.cd",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@2024!"),
                NomComplet = "Admin Système",
                Role = UserRole.Admin,
                Matricule = "ADM-001",
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
                NomComplet = "Benoît LWAMBA BINDU",
                Role = UserRole.Manager,
                Matricule = "PRE-001",
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
                NomComplet = "Juge MBALA MUDIMBI",
                Role = UserRole.Collaborateur,
                Matricule = "JCC-001",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },

            new User
            {
                Id = juge2Id,
                Username = "juge.tshisekedi",
                Email = "tshisekedi@courconstitutionnelle.cd",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Juge@2024!"),
                NomComplet = "Juge TSHISEKEDI KALALA",
                Role = UserRole.Collaborateur,
                Matricule = "JCC-002",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },

            new User
            {
                Id = juge3Id,
                Username = "juge.kabongo",
                Email = "kabongo@courconstitutionnelle.cd",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Juge@2024!"),
                NomComplet = "Juge KABONGO MBUYA",
                Role = UserRole.Collaborateur,
                Matricule = "JCC-003",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },

            // Greffier Principal
            new User
            {
                Id = greffierId,
                Username = "greffier.principal",
                Email = "greffier@courconstitutionnelle.cd",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Greffier@2024!"),
                NomComplet = "MUKENDI KALENGA",
                Role = UserRole.Assistant,
                Matricule = "GRE-001",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },

            // Greffier Adjoint
            new User
            {
                Id = greffierAdjId,
                Username = "greffier.adjoint",
                Email = "greffier.adj@courconstitutionnelle.cd",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Greffier@2024!"),
                NomComplet = "ILUNGA NKULU",
                Role = UserRole.AssistantJunior,
                Matricule = "GRA-001",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },

            // Consultant
            new User
            {
                Id = consultantId,
                Username = "consultant.legal",
                Email = "consultant@courconstitutionnelle.cd",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Consultant@2024!"),
                NomComplet = "MULUMBA TSHIAMA",
                Role = UserRole.Consultant,
                Matricule = "CON-001",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            }
        };

        await context.Users.AddRangeAsync(users);
        await context.SaveChangesAsync();

        // =====================================================
        // CRÉATION DES DOSSIERS
        // =====================================================
        
        // Récupérer les TypeAffaires créés
        var typeContentieux = await context.TypeAffaires.FirstOrDefaultAsync(t => t.Nom == "Contentieux Électoral");
        var typeControle = await context.TypeAffaires.FirstOrDefaultAsync(t => t.Nom == "Contrôle de Constitutionnalité");
        var typeConflit = await context.TypeAffaires.FirstOrDefaultAsync(t => t.Nom == "Conflit de Compétence");
        var typeInterpretation = await context.TypeAffaires.FirstOrDefaultAsync(t => t.Nom == "Interprétation de la Constitution");
        var typeException = await context.TypeAffaires.FirstOrDefaultAsync(t => t.Nom == "Exception d'Inconstitutionnalité");

        var dossiers = new List<Dossier>
        {
            // Dossier 1 - Contentieux Électoral
            new Dossier
            {
                Id = Guid.NewGuid(),
                NumeroDossier = "CC-2024-001",
                Titre = "Contentieux électoral - Province du Nord-Kivu - Contestation résultats législatives",
                TypeAffaireId = typeContentieux?.Id,
                Demandeur = "Parti Politique ENSEMBLE pour la République",
                Defendeur = "Commission Électorale Nationale Indépendante (CENI)",
                DateDepot = new DateTime(2024, 11, 1, 10, 0, 0, DateTimeKind.Utc),
                DateAudience = new DateTime(2024, 11, 15, 9, 0, 0, DateTimeKind.Utc),
                Status = StatusDossier.EnCours,
                Priorite = PrioriteDossier.Haute,
                Resume = "Contestation des résultats des élections législatives dans 5 circonscriptions du Nord-Kivu. Le demandeur allègue des irrégularités graves dans le processus de dépouillement et demande l'annulation des résultats proclamés.",
                RapporteurId = juge1Id,
                CreatedBy = greffierId,
                CreatedAt = new DateTime(2024, 11, 1, 10, 0, 0, DateTimeKind.Utc),
                Historiques = new List<Historique>
                {
                    new Historique
                    {
                        Id = Guid.NewGuid(),
                        DateAction = new DateTime(2024, 11, 1, 10, 0, 0, DateTimeKind.Utc),
                        Action = "Dépôt de la requête",
                        Details = "Requête déposée avec 127 pièces justificatives",
                        UserId = greffierId
                    },
                    new Historique
                    {
                        Id = Guid.NewGuid(),
                        DateAction = new DateTime(2024, 11, 3, 14, 30, 0, DateTimeKind.Utc),
                        Action = "Attribution au rapporteur",
                        Details = "Dossier attribué à Juge MBALA MUDIMBI",
                        UserId = presidentId
                    },
                    new Historique
                    {
                        Id = Guid.NewGuid(),
                        DateAction = new DateTime(2024, 11, 5, 11, 15, 0, DateTimeKind.Utc),
                        Action = "Demande de pièces complémentaires",
                        Details = "Demande d'audition de 12 témoins et production des procès-verbaux originaux",
                        UserId = juge1Id
                    }
                }
            },

            // Dossier 2 - Contrôle de Constitutionnalité
            new Dossier
            {
                Id = Guid.NewGuid(),
                NumeroDossier = "CC-2024-002",
                Titre = "Contrôle de constitutionnalité - Loi de finances pour l'exercice 2025",
                TypeAffaireId = typeControle?.Id,
                Demandeur = "Assemblée Nationale de la RDC",
                DateDepot = new DateTime(2024, 10, 28, 15, 0, 0, DateTimeKind.Utc),
                DateAudience = new DateTime(2024, 11, 10, 14, 0, 0, DateTimeKind.Utc),
                Status = StatusDossier.EnValidation,
                Priorite = PrioriteDossier.Urgente,
                Resume = "Contrôle a priori de la conformité de la loi de finances 2025 avec la Constitution, notamment concernant les articles relatifs aux emprunts publics et à la répartition des recettes entre l'État central et les provinces.",
                RapporteurId = juge2Id,
                CreatedBy = greffierId,
                CreatedAt = new DateTime(2024, 10, 28, 15, 0, 0, DateTimeKind.Utc),
                Historiques = new List<Historique>
                {
                    new Historique
                    {
                        Id = Guid.NewGuid(),
                        DateAction = new DateTime(2024, 10, 28, 15, 0, 0, DateTimeKind.Utc),
                        Action = "Dépôt du dossier",
                        Details = "Texte de loi transmis par le Président de l'Assemblée Nationale",
                        UserId = greffierId
                    },
                    new Historique
                    {
                        Id = Guid.NewGuid(),
                        DateAction = new DateTime(2024, 10, 30, 9, 0, 0, DateTimeKind.Utc),
                        Action = "Audience publique tenue",
                        Details = "Audience en présence du Ministre des Finances et des députés rapporteurs",
                        UserId = presidentId
                    },
                    new Historique
                    {
                        Id = Guid.NewGuid(),
                        DateAction = new DateTime(2024, 11, 6, 16, 0, 0, DateTimeKind.Utc),
                        Action = "Mise en délibéré",
                        Details = "Affaire mise en délibéré pour décision",
                        UserId = presidentId
                    }
                }
            },

            // Dossier 3 - Conflit de Compétence
            new Dossier
            {
                Id = Guid.NewGuid(),
                NumeroDossier = "CC-2024-003",
                Titre = "Conflit de compétence - Gouverneur Province Équateur vs Assemblée Provinciale",
                TypeAffaireId = typeConflit?.Id,
                Demandeur = "Gouverneur de la Province de l'Équateur",
                Defendeur = "Assemblée Provinciale de l'Équateur",
                DateDepot = new DateTime(2024, 11, 7, 11, 30, 0, DateTimeKind.Utc),
                Status = StatusDossier.Nouveau,
                Priorite = PrioriteDossier.Normale,
                Resume = "Conflit relatif à l'adoption du budget provincial. Le Gouverneur conteste la compétence de l'Assemblée Provinciale à modifier certaines lignes budgétaires relatives aux compétences exclusives du pouvoir exécutif provincial.",
                CreatedBy = greffierId,
                CreatedAt = new DateTime(2024, 11, 7, 11, 30, 0, DateTimeKind.Utc),
                Historiques = new List<Historique>
                {
                    new Historique
                    {
                        Id = Guid.NewGuid(),
                        DateAction = new DateTime(2024, 11, 7, 11, 30, 0, DateTimeKind.Utc),
                        Action = "Enregistrement du dossier",
                        Details = "Dossier enregistré - En attente d'attribution",
                        UserId = greffierId
                    }
                }
            },

            // Dossier 4 - Interprétation de la Constitution
            new Dossier
            {
                Id = Guid.NewGuid(),
                NumeroDossier = "CC-2024-004",
                Titre = "Interprétation de l'article 78 de la Constitution - Durée du mandat présidentiel",
                TypeAffaireId = typeInterpretation?.Id,
                Demandeur = "Groupe Parlementaire Union pour la Démocratie et le Progrès Social",
                DateDepot = new DateTime(2024, 10, 15, 9, 0, 0, DateTimeKind.Utc),
                DateDecision = new DateTime(2024, 11, 3, 10, 0, 0, DateTimeKind.Utc),
                Status = StatusDossier.Valide,
                Priorite = PrioriteDossier.Haute,
                Resume = "Demande d'interprétation concernant la computation de la durée du mandat présidentiel et les conditions de renouvellement du mandat.",
                RapporteurId = juge3Id,
                CreatedBy = greffierId,
                CreatedAt = new DateTime(2024, 10, 15, 9, 0, 0, DateTimeKind.Utc),
                Observations = "Décision rendue - Arrêt R.Const. 123/2024 du 03/11/2024",
                Historiques = new List<Historique>
                {
                    new Historique
                    {
                        Id = Guid.NewGuid(),
                        DateAction = new DateTime(2024, 10, 15, 9, 0, 0, DateTimeKind.Utc),
                        Action = "Saisine de la Cour",
                        Details = "Requête en interprétation déposée",
                        UserId = greffierId
                    },
                    new Historique
                    {
                        Id = Guid.NewGuid(),
                        DateAction = new DateTime(2024, 10, 18, 14, 0, 0, DateTimeKind.Utc),
                        Action = "Attribution au rapporteur",
                        Details = "Dossier attribué à Juge KABONGO MBUYA",
                        UserId = presidentId
                    },
                    new Historique
                    {
                        Id = Guid.NewGuid(),
                        DateAction = new DateTime(2024, 10, 25, 10, 0, 0, DateTimeKind.Utc),
                        Action = "Audience publique",
                        Details = "Audience contradictoire tenue",
                        UserId = presidentId
                    },
                    new Historique
                    {
                        Id = Guid.NewGuid(),
                        DateAction = new DateTime(2024, 11, 3, 10, 0, 0, DateTimeKind.Utc),
                        Action = "Décision rendue",
                        Details = "Arrêt R.Const. 123/2024 prononcé en audience publique",
                        UserId = presidentId
                    }
                }
            },

            // Dossier 5 - Exception d'inconstitutionnalité
            new Dossier
            {
                Id = Guid.NewGuid(),
                NumeroDossier = "CC-2024-005",
                Titre = "Exception d'inconstitutionnalité - Loi n°08/012 du 31/07/2008 sur l'organisation judiciaire",
                TypeAffaireId = typeException?.Id,
                Demandeur = "Cour d'Appel de Lubumbashi",
                DateDepot = new DateTime(2024, 11, 8, 10, 0, 0, DateTimeKind.Utc),
                Status = StatusDossier.Nouveau,
                Priorite = PrioriteDossier.Normale,
                Resume = "Exception d'inconstitutionnalité soulevée concernant les articles 15 et 16 de la loi portant organisation judiciaire, relatifs à la composition des formations de jugement, suspectés de violation du principe d'égalité devant la loi.",
                CreatedBy = greffierId,
                CreatedAt = new DateTime(2024, 11, 8, 10, 0, 0, DateTimeKind.Utc),
                Historiques = new List<Historique>
                {
                    new Historique
                    {
                        Id = Guid.NewGuid(),
                        DateAction = new DateTime(2024, 11, 8, 10, 0, 0, DateTimeKind.Utc),
                        Action = "Réception de l'exception",
                        Details = "Exception transmise par la Cour d'Appel de Lubumbashi",
                        UserId = greffierId
                    }
                }
            }
        };

        await context.Dossiers.AddRangeAsync(dossiers);
        await context.SaveChangesAsync();

        // =====================================================
        // DOCUMENTS (Exemples)
        // =====================================================

        var documents = new List<Document>
        {
            new Document
            {
                Id = Guid.NewGuid(),
                DossierId = dossiers[0].Id,
                NomFichier = "Requete_initiale_CC-2024-001.pdf",
                CheminFichier = "/documents/2024/11/requete_001.pdf",
                TypeDocument = "Requête",
                TailleFichier = 2048576,
                MimeType = "application/pdf",
                NumeroVersion = 1,
                EstConfidentiel = false,
                HashSHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                UploadedBy = greffierId,
                UploadedAt = new DateTime(2024, 11, 1, 10, 15, 0, DateTimeKind.Utc)
            },

            new Document
            {
                Id = Guid.NewGuid(),
                DossierId = dossiers[0].Id,
                NomFichier = "Pieces_justificatives_127_pieces.pdf",
                CheminFichier = "/documents/2024/11/pieces_001.pdf",
                TypeDocument = "Pièces justificatives",
                TailleFichier = 15728640,
                MimeType = "application/pdf",
                NumeroVersion = 1,
                EstConfidentiel = false,
                HashSHA256 = "f7c3bc1d808e04732adf679965ccc34ca7ae3441",
                UploadedBy = greffierId,
                UploadedAt = new DateTime(2024, 11, 1, 10, 20, 0, DateTimeKind.Utc)
            },

            new Document
            {
                Id = Guid.NewGuid(),
                DossierId = dossiers[1].Id,
                NomFichier = "Loi_finances_2025_texte_integral.pdf",
                CheminFichier = "/documents/2024/10/loi_finances_2025.pdf",
                TypeDocument = "Texte de loi",
                TailleFichier = 5242880,
                MimeType = "application/pdf",
                NumeroVersion = 1,
                EstConfidentiel = false,
                HashSHA256 = "d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2",
                UploadedBy = greffierId,
                UploadedAt = new DateTime(2024, 10, 28, 15, 10, 0, DateTimeKind.Utc)
            },

            new Document
            {
                Id = Guid.NewGuid(),
                DossierId = dossiers[3].Id,
                NomFichier = "Arret_R_Const_123_2024.pdf",
                CheminFichier = "/documents/2024/11/arret_123_2024.pdf",
                TypeDocument = "Décision",
                TailleFichier = 1048576,
                MimeType = "application/pdf",
                NumeroVersion = 1,
                EstConfidentiel = false,
                HashSHA256 = "abcdef1234567890abcdef1234567890abcdef12",
                UploadedBy = presidentId,
                UploadedAt = new DateTime(2024, 11, 3, 11, 0, 0, DateTimeKind.Utc)
            }
        };

        await context.Documents.AddRangeAsync(documents);
        await context.SaveChangesAsync();

        // =====================================================
        // LOGS D'AUDIT (Exemples)
        // =====================================================

        var auditLogs = new List<AuditLog>
        {
            new AuditLog
            {
                Id = Guid.NewGuid(),
                Timestamp = new DateTime(2024, 11, 1, 9, 0, 0, DateTimeKind.Utc),
                UserId = greffierId,
                Action = "LOGIN_SUCCESS",
                EntityType = "User",
                EntityId = greffierId.ToString(),
                IpAddress = "41.243.7.12",
                UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            },

            new AuditLog
            {
                Id = Guid.NewGuid(),
                Timestamp = new DateTime(2024, 11, 1, 10, 0, 0, DateTimeKind.Utc),
                UserId = greffierId,
                Action = "CREATE",
                EntityType = "Dossier",
                EntityId = dossiers[0].Id.ToString(),
                NewValues = "{\"NumeroDossier\":\"CC-2024-001\",\"Status\":\"Nouveau\"}",
                IpAddress = "41.243.7.12",
                UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
        };

        await context.AuditLogs.AddRangeAsync(auditLogs);
        await context.SaveChangesAsync();

        Console.WriteLine("✅ Base de données initialisée avec succès!");
        Console.WriteLine($"   - {users.Count} utilisateurs créés");
        Console.WriteLine($"   - {dossiers.Count} dossiers créés");
        Console.WriteLine($"   - {documents.Count} documents créés");
        Console.WriteLine($"   - {auditLogs.Count} logs d'audit créés");
        Console.WriteLine("\n📌 Comptes de test:");
        Console.WriteLine("   Admin: admin / Admin@2024!");
        Console.WriteLine("   Président: president.benoit / President@2024!");
        Console.WriteLine("   Juge: juge.mbala / Juge@2024!");
        Console.WriteLine("   Greffier: greffier.principal / Greffier@2024!");
    }
}