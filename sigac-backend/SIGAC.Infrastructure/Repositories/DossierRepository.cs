using Microsoft.EntityFrameworkCore;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using SIGAC.Infrastructure.Data;

namespace SIGAC.Infrastructure.Repositories;

public class DossierRepository : IDossierRepository
{
    private readonly ApplicationDbContext _context;

    public DossierRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(List<Dossier> dossiers, int totalCount)> GetDossiersAsync(
        int page, int pageSize, string? search, Guid? typeAffaireId, StatusDossier? status,
        PrioriteDossier? priorite, DateTime? dateDebutMin, DateTime? dateDebutMax, Guid? rapporteurId, Guid? workspaceId, bool includeAllForAdmin = false)
    {
        var query = _context.Dossiers
            .Include(d => d.TypeAffaire)
            .Include(d => d.Rapporteur)
            .Include(d => d.Documents)
            .AsQueryable();

        // Filtres
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(d =>
                d.NumeroDossier.Contains(search) ||
                d.Titre.Contains(search) ||
                d.Demandeur.Contains(search));
        }

        if (typeAffaireId.HasValue)
        {
            query = query.Where(d => d.TypeAffaireId == typeAffaireId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(d => d.Status == status.Value);
        }

        if (priorite.HasValue)
        {
            query = query.Where(d => d.Priorite == priorite.Value);
        }

        if (dateDebutMin.HasValue)
        {
            query = query.Where(d => d.DateDepot >= dateDebutMin.Value);
        }

        if (dateDebutMax.HasValue)
        {
            query = query.Where(d => d.DateDepot <= dateDebutMax.Value);
        }

        if (rapporteurId.HasValue)
        {
            query = query.Where(d => d.RapporteurId == rapporteurId.Value);
        }

        // 🆕 FILTRAGE PAR WORKSPACE (sauf si includeAllForAdmin = true)
        // Les admins sans workspaceId voient TOUS les dossiers
        if (!includeAllForAdmin && workspaceId.HasValue)
        {
            query = query.Where(d => d.WorkspaceId == workspaceId.Value);
        }

        // Exclure les dossiers classés (suppression logique)
        query = query.Where(d => d.Status != StatusDossier.Classe);

        var totalCount = await query.CountAsync();

        // Pagination et tri
        var dossiers = await query
            .OrderByDescending(d => d.DateDepot)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (dossiers, totalCount);
    }

    public async Task<Dossier?> GetByIdAsync(Guid id)
    {
        return await _context.Dossiers
            .Include(d => d.TypeAffaire)
            .Include(d => d.Rapporteur)
            .Include(d => d.Documents)
            .Include(d => d.Historiques)
                .ThenInclude(h => h.User)
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<Dossier?> GetByIdWithoutHistoriquesAsync(Guid id)
    {
        // Charge le dossier SANS les historiques pour éviter les problèmes de concurrence
        return await _context.Dossiers
            .Include(d => d.TypeAffaire)
            .Include(d => d.Rapporteur)
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<Dossier?> GetByNumeroDossierAsync(string numeroDossier)
    {
        return await _context.Dossiers
            .Include(d => d.TypeAffaire)
            .Include(d => d.Rapporteur)
            .Include(d => d.Documents)
            .Include(d => d.Historiques)
            .FirstOrDefaultAsync(d => d.NumeroDossier == numeroDossier);
    }

    public async Task<int> GetLastDossierNumberForYearAsync(int year)
    {
        var prefix = $"CC-{year}-";
        
        var lastDossier = await _context.Dossiers
            .Where(d => d.NumeroDossier.StartsWith(prefix))
            .OrderByDescending(d => d.NumeroDossier)
            .FirstOrDefaultAsync();

        if (lastDossier == null)
        {
            return 0;
        }

        // Extraire le numéro de la fin (ex: CC-2024-001 -> 001)
        var numberPart = lastDossier.NumeroDossier.Substring(prefix.Length);
        return int.TryParse(numberPart, out var number) ? number : 0;
    }

    public async Task<DossierStatistics> GetStatisticsAsync(Guid? rapporteurId = null)
    {
        var query = _context.Dossiers.AsQueryable();

        if (rapporteurId.HasValue)
        {
            query = query.Where(d => d.RapporteurId == rapporteurId.Value);
        }

        var stats = new DossierStatistics
        {
            TotalDossiers = await query.CountAsync(),
            NouveauxDossiers = await query.CountAsync(d => d.Status == StatusDossier.Nouveau),
            EnInstruction = await query.CountAsync(d => d.Status == StatusDossier.EnInstruction),
            EnDelibere = await query.CountAsync(d => d.Status == StatusDossier.EnDelibere),
            Juges = await query.CountAsync(d => d.Status == StatusDossier.Juge),
            Classes = await query.CountAsync(d => d.Status == StatusDossier.Classe),
            ParType = await _context.Dossiers
                .GroupBy(d => d.TypeAffaireId)
                .Select(g => new {
                    TypeNom = _context.TypeAffaires
                        .Where(t => t.Id == g.Key)
                        .Select(t => t.Nom)
                        .FirstOrDefault() ?? "(Non spécifié)",
                    Count = g.Count()
                })
                .ToDictionaryAsync(x => x.TypeNom, x => x.Count),
            ParPriorite = await query
                .GroupBy(d => d.Priorite)
                .Select(g => new { Priorite = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Priorite.ToString(), x => x.Count)
        };

        return stats;
    }

    public async Task AddAsync(Dossier dossier)
    {
        await _context.Dossiers.AddAsync(dossier);
    }

    public async Task UpdateAsync(Dossier dossier)
    {
        _context.Dossiers.Update(dossier);
        await Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid id)
    {
        var dossier = await GetByIdAsync(id);
        if (dossier != null)
        {
            _context.Dossiers.Remove(dossier);
        }
    }

    public async Task AddHistoriqueAsync(Historique historique)
    {
        await _context.Historiques.AddAsync(historique);
    }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }
}