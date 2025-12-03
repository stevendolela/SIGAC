using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;

namespace SIGAC.Core.Services;

public class SalleService : ISalleService
{
    private readonly ISalleRepository _salleRepository;
    private readonly IUserRepository _userRepository;
    private readonly IAuditLogRepository _auditLogRepository;

    public SalleService(
        ISalleRepository salleRepository,
        IUserRepository userRepository,
        IAuditLogRepository auditLogRepository)
    {
        _salleRepository = salleRepository;
        _userRepository = userRepository;
        _auditLogRepository = auditLogRepository;
    }

    public async Task<List<SalleListDto>> GetSallesAsync(bool? activeOnly = null)
    {
        var salles = await _salleRepository.GetAllAsync(activeOnly);
        
        return salles.Select(s => new SalleListDto
        {
            Id = s.Id,
            Nom = s.Nom,
            Description = s.Description,
            Capacite = s.Capacite,
            EstActive = s.EstActive,
            CreatedAt = s.CreatedAt
        }).ToList();
    }

    public async Task<SalleDetailDto> GetSalleByIdAsync(Guid id)
    {
        var salle = await _salleRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Salle avec l'ID {id} introuvable");

        var createdBy = await _userRepository.GetByIdAsync(salle.CreatedBy);

        return new SalleDetailDto
        {
            Id = salle.Id,
            Nom = salle.Nom,
            Description = salle.Description,
            Capacite = salle.Capacite,
            EstActive = salle.EstActive,
            CreatedBy = salle.CreatedBy,
            CreatedByName = createdBy?.NomComplet ?? "Inconnu",
            CreatedAt = salle.CreatedAt,
            UpdatedAt = salle.UpdatedAt
        };
    }

    public async Task<SalleDetailDto> CreateSalleAsync(CreateSalleDto dto, Guid userId)
    {
        // Validation
        if (string.IsNullOrWhiteSpace(dto.Nom))
            throw new ArgumentException("Le nom de la salle est requis");

        if (dto.Capacite < 1)
            throw new ArgumentException("La capacité doit être supérieure à 0");

        // Vérifier l'unicité du nom
        var existing = await _salleRepository.GetByNomAsync(dto.Nom);
        if (existing != null)
            throw new ArgumentException($"Une salle avec le nom '{dto.Nom}' existe déjà");

        var salle = new Salle
        {
            Id = Guid.NewGuid(),
            Nom = dto.Nom,
            Description = dto.Description,
            Capacite = dto.Capacite,
            EstActive = true,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        await _salleRepository.AddAsync(salle);
        await _salleRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId,
            "CREATE",
            "Salle",
            salle.Id.ToString(),
            null,
            System.Text.Json.JsonSerializer.Serialize(salle)
        );

        return await GetSalleByIdAsync(salle.Id);
    }

    public async Task<SalleDetailDto> UpdateSalleAsync(Guid id, UpdateSalleDto dto, Guid userId)
    {
        var salle = await _salleRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Salle avec l'ID {id} introuvable");

        var oldValues = System.Text.Json.JsonSerializer.Serialize(salle);

        // Mettre à jour les champs
        if (!string.IsNullOrWhiteSpace(dto.Nom) && dto.Nom != salle.Nom)
        {
            // Vérifier l'unicité
            var existing = await _salleRepository.GetByNomAsync(dto.Nom);
            if (existing != null && existing.Id != id)
                throw new ArgumentException($"Une salle avec le nom '{dto.Nom}' existe déjà");
            
            salle.Nom = dto.Nom;
        }

        if (dto.Description != null)
            salle.Description = dto.Description;

        if (dto.Capacite.HasValue)
        {
            if (dto.Capacite.Value < 1)
                throw new ArgumentException("La capacité doit être supérieure à 0");
            
            salle.Capacite = dto.Capacite.Value;
        }

        if (dto.EstActive.HasValue)
            salle.EstActive = dto.EstActive.Value;

        salle.UpdatedAt = DateTime.UtcNow;

        await _salleRepository.UpdateAsync(salle);
        await _salleRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId,
            "UPDATE",
            "Salle",
            salle.Id.ToString(),
            oldValues,
            System.Text.Json.JsonSerializer.Serialize(salle)
        );

        return await GetSalleByIdAsync(id);
    }

    public async Task DeleteSalleAsync(Guid id, Guid userId)
    {
        var salle = await _salleRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Salle avec l'ID {id} introuvable");

        var oldValues = System.Text.Json.JsonSerializer.Serialize(salle);

        await _salleRepository.DeleteAsync(salle);
        await _salleRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId,
            "DELETE",
            "Salle",
            id.ToString(),
            oldValues,
            null
        );
    }
}
