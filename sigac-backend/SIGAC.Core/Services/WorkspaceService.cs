using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using System.Text.Json;

namespace SIGAC.Core.Services;

/// <summary>
/// Service pour la gestion des workspaces
/// </summary>
public class WorkspaceService : IWorkspaceService
{
    private readonly IWorkspaceRepository _workspaceRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IMapper _mapper;

    public WorkspaceService(
        IWorkspaceRepository workspaceRepository,
        IAuditLogRepository auditLogRepository,
        IMapper mapper)
    {
        _workspaceRepository = workspaceRepository;
        _auditLogRepository = auditLogRepository;
        _mapper = mapper;
    }

    public async Task<WorkspaceDto> CreateWorkspaceAsync(CreateWorkspaceDto dto, Guid userId)
    {
        // Validation: slug unique
        if (await _workspaceRepository.SlugExistsAsync(dto.Slug))
        {
            throw new ArgumentException($"Le slug '{dto.Slug}' est déjà utilisé par un autre workspace");
        }

        var workspace = _mapper.Map<Workspace>(dto);
        workspace.OwnerId = userId;
        workspace.CreatedAt = DateTime.UtcNow;

        // Ajouter le créateur comme Owner dans Members
        workspace.Members = new List<WorkspaceUser>
        {
            new WorkspaceUser
            {
                WorkspaceId = workspace.Id,
                TenantId = workspace.TenantId,
                UserId = userId,
                Role = WorkspaceRole.Owner,
                JoinedAt = DateTime.UtcNow,
                IsActive = true
            }
        };

        await _workspaceRepository.AddAsync(workspace);
        await _workspaceRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId,
            "CREATE",
            "Workspace",
            workspace.Id.ToString(),
            null,
            JsonSerializer.Serialize(new { workspace.Id, workspace.Name, workspace.Slug }));

        // Récupérer avec relations pour le DTO
        var createdWorkspace = await _workspaceRepository.GetByIdAsync(
            workspace.Id, 
            includeMembers: true, 
            includeProjects: true, 
            includeOwner: true);

        var result = _mapper.Map<WorkspaceDto>(createdWorkspace!);
        result.UserRole = WorkspaceRole.Owner;
        
        return result;
    }

    public async Task<List<WorkspaceDto>> GetUserWorkspacesAsync(Guid userId)
    {
        var workspaces = await _workspaceRepository.GetUserWorkspacesAsync(userId);
        var dtos = new List<WorkspaceDto>();

        foreach (var workspace in workspaces)
        {
            var dto = _mapper.Map<WorkspaceDto>(workspace);
            
            // Déterminer le rôle de l'utilisateur
            var membership = workspace.Members?.FirstOrDefault(m => m.UserId == userId && m.IsActive);
            dto.UserRole = membership?.Role ?? WorkspaceRole.Guest;
            
            dtos.Add(dto);
        }

        return dtos;
    }

    public async Task<WorkspaceDto> GetWorkspaceByIdAsync(Guid workspaceId, Guid userId)
    {
        var workspace = await _workspaceRepository.GetByIdAsync(
            workspaceId, 
            includeMembers: true, 
            includeProjects: true, 
            includeOwner: true);

        if (workspace == null)
        {
            throw new KeyNotFoundException($"Workspace avec l'ID {workspaceId} introuvable");
        }

        // Vérifier que l'utilisateur a accès
        var membership = await _workspaceRepository.GetMembershipAsync(workspaceId, userId);
        if (membership == null || !membership.IsActive)
        {
            throw new UnauthorizedAccessException("Vous n'avez pas accès à ce workspace");
        }

        var dto = _mapper.Map<WorkspaceDto>(workspace);
        dto.UserRole = membership.Role;
        
        return dto;
    }

    public async Task<WorkspaceDto> GetWorkspaceBySlugAsync(string slug, Guid userId)
    {
        var workspace = await _workspaceRepository.GetBySlugAsync(
            slug, 
            includeMembers: true, 
            includeOwner: true);

        if (workspace == null)
        {
            throw new KeyNotFoundException($"Workspace avec le slug '{slug}' introuvable");
        }

        // Vérifier que l'utilisateur a accès
        var membership = await _workspaceRepository.GetMembershipAsync(workspace.Id, userId);
        if (membership == null || !membership.IsActive)
        {
            throw new UnauthorizedAccessException("Vous n'avez pas accès à ce workspace");
        }

        var dto = _mapper.Map<WorkspaceDto>(workspace);
        dto.UserRole = membership.Role;
        
        return dto;
    }

    public async Task<WorkspaceDto> UpdateWorkspaceAsync(Guid workspaceId, UpdateWorkspaceDto dto, Guid userId)
    {
        // Vérifier permissions (Admin ou Owner uniquement)
        if (!await HasPermissionAsync(workspaceId, userId, WorkspaceRole.Admin))
        {
            throw new UnauthorizedAccessException("Seuls les admins et owners peuvent modifier le workspace");
        }

        var workspace = await _workspaceRepository.GetByIdAsync(
            workspaceId, 
            includeMembers: true, 
            includeProjects: true, 
            includeOwner: true);

        if (workspace == null)
        {
            throw new KeyNotFoundException($"Workspace avec l'ID {workspaceId} introuvable");
        }

        var oldValues = JsonSerializer.Serialize(workspace);

        // Appliquer les modifications
        if (dto.Name != null) workspace.Name = dto.Name;
        if (dto.Description != null) workspace.Description = dto.Description;
        if (dto.LogoUrl != null) workspace.LogoUrl = dto.LogoUrl;
        if (dto.MaxStorageGB.HasValue) workspace.MaxStorageGB = dto.MaxStorageGB.Value;
        if (dto.MaxUsers.HasValue) workspace.MaxUsers = dto.MaxUsers.Value;
        if (dto.AllowGuestAccess.HasValue) workspace.AllowGuestAccess = dto.AllowGuestAccess.Value;
        if (dto.IsActive.HasValue) workspace.IsActive = dto.IsActive.Value;
        
        workspace.ModifiedAt = DateTime.UtcNow;

        await _workspaceRepository.UpdateAsync(workspace);
        await _workspaceRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId,
            "UPDATE",
            "Workspace",
            workspace.Id.ToString(),
            oldValues,
            JsonSerializer.Serialize(workspace));

        var result = _mapper.Map<WorkspaceDto>(workspace);
        var membership = await _workspaceRepository.GetMembershipAsync(workspaceId, userId);
        result.UserRole = membership?.Role ?? WorkspaceRole.Guest;
        
        return result;
    }

    public async Task DeleteWorkspaceAsync(Guid workspaceId, Guid userId)
    {
        // Vérifier permissions (Owner uniquement)
        var membership = await _workspaceRepository.GetMembershipAsync(workspaceId, userId);
        if (membership?.Role != WorkspaceRole.Owner)
        {
            throw new UnauthorizedAccessException("Seul le propriétaire peut supprimer le workspace");
        }

        var workspace = await _workspaceRepository.GetByIdAsync(workspaceId);
        if (workspace == null)
        {
            throw new KeyNotFoundException($"Workspace avec l'ID {workspaceId} introuvable");
        }

        // Soft delete
        workspace.IsActive = false;
        workspace.ModifiedAt = DateTime.UtcNow;

        await _workspaceRepository.UpdateAsync(workspace);
        await _workspaceRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId,
            "DELETE",
            "Workspace",
            workspace.Id.ToString(),
            JsonSerializer.Serialize(workspace),
            null);
    }

    public async Task<List<WorkspaceMemberDto>> GetWorkspaceMembersAsync(Guid workspaceId, Guid userId)
    {
        // Vérifier que l'utilisateur a accès au workspace
        var membership = await _workspaceRepository.GetMembershipAsync(workspaceId, userId);
        if (membership == null || !membership.IsActive)
        {
            throw new UnauthorizedAccessException("Vous n'avez pas accès à ce workspace");
        }

        var members = await _workspaceRepository.GetWorkspaceMembersAsync(workspaceId, includeInactive: false);
        return _mapper.Map<List<WorkspaceMemberDto>>(members);
    }

    public async Task AddMemberAsync(Guid workspaceId, AddWorkspaceMemberDto dto, Guid userId)
    {
        // Vérifier permissions (Admin ou Owner uniquement)
        if (!await HasPermissionAsync(workspaceId, userId, WorkspaceRole.Admin))
        {
            throw new UnauthorizedAccessException("Seuls les admins et owners peuvent ajouter des membres");
        }

        // Vérifier que le workspace existe
        var workspace = await _workspaceRepository.GetByIdAsync(workspaceId, includeMembers: true);
        if (workspace == null)
        {
            throw new KeyNotFoundException($"Workspace avec l'ID {workspaceId} introuvable");
        }

        // Vérifier la limite de membres
        var activeMembersCount = workspace.Members.Count(m => m.IsActive);
        if (activeMembersCount >= workspace.MaxUsers)
        {
            throw new InvalidOperationException($"Limite de {workspace.MaxUsers} membres atteinte");
        }

        // Vérifier si l'utilisateur est déjà membre
        var existingMember = await _workspaceRepository.GetMembershipAsync(workspaceId, dto.UserId);
        if (existingMember != null)
        {
            if (existingMember.IsActive)
            {
                throw new ArgumentException("Cet utilisateur est déjà membre du workspace");
            }
            else
            {
                // Réactiver le membre
                existingMember.IsActive = true;
                existingMember.Role = dto.Role;
                existingMember.JoinedAt = DateTime.UtcNow;
                existingMember.InvitedBy = userId;
            }
        }
        else
        {
            // Nouveau membre
            var newMember = new WorkspaceUser
            {
                WorkspaceId = workspaceId,
                TenantId = workspace.TenantId,
                UserId = dto.UserId,
                Role = dto.Role,
                JoinedAt = DateTime.UtcNow,
                InvitedBy = userId,
                IsActive = true
            };

            await _workspaceRepository.AddMemberAsync(newMember);
        }

        await _workspaceRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId,
            "ADD_MEMBER",
            "Workspace",
            workspaceId.ToString(),
            null,
            JsonSerializer.Serialize(new { MemberId = dto.UserId, Role = dto.Role }));
    }

    public async Task UpdateMemberRoleAsync(Guid workspaceId, Guid memberId, WorkspaceRole newRole, Guid userId)
    {
        // Vérifier permissions (Admin ou Owner uniquement)
        if (!await HasPermissionAsync(workspaceId, userId, WorkspaceRole.Admin))
        {
            throw new UnauthorizedAccessException("Seuls les admins et owners peuvent modifier les rôles");
        }

        var membership = await _workspaceRepository.GetMembershipAsync(workspaceId, memberId);
        if (membership == null)
        {
            throw new KeyNotFoundException("Membre introuvable dans ce workspace");
        }

        // Empêcher de modifier le rôle du owner
        if (membership.Role == WorkspaceRole.Owner)
        {
            throw new InvalidOperationException("Impossible de modifier le rôle du propriétaire");
        }

        var oldRole = membership.Role;
        membership.Role = newRole;

        await _workspaceRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId,
            "UPDATE_MEMBER_ROLE",
            "Workspace",
            workspaceId.ToString(),
            JsonSerializer.Serialize(new { MemberId = memberId, OldRole = oldRole }),
            JsonSerializer.Serialize(new { MemberId = memberId, NewRole = newRole }));
    }

    public async Task RemoveMemberAsync(Guid workspaceId, Guid memberId, Guid userId)
    {
        // Vérifier permissions (Admin ou Owner uniquement)
        if (!await HasPermissionAsync(workspaceId, userId, WorkspaceRole.Admin))
        {
            throw new UnauthorizedAccessException("Seuls les admins et owners peuvent retirer des membres");
        }

        var membership = await _workspaceRepository.GetMembershipAsync(workspaceId, memberId);
        if (membership == null)
        {
            throw new KeyNotFoundException("Membre introuvable dans ce workspace");
        }

        // Empêcher de retirer le owner
        if (membership.Role == WorkspaceRole.Owner)
        {
            throw new InvalidOperationException("Impossible de retirer le propriétaire du workspace");
        }

        // Soft delete
        membership.IsActive = false;

        await _workspaceRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId,
            "REMOVE_MEMBER",
            "Workspace",
            workspaceId.ToString(),
            JsonSerializer.Serialize(new { MemberId = memberId, Role = membership.Role }),
            null);
    }

    public async Task<bool> HasPermissionAsync(Guid workspaceId, Guid userId, WorkspaceRole minimumRole)
    {
        var membership = await _workspaceRepository.GetMembershipAsync(workspaceId, userId);
        
        if (membership == null || !membership.IsActive)
            return false;

        // Owner a tous les droits
        if (membership.Role == WorkspaceRole.Owner)
            return true;

        // Admin peut tout sauf si minimumRole est Owner
        if (membership.Role == WorkspaceRole.Admin && minimumRole != WorkspaceRole.Owner)
            return true;

        // Member peut si minimumRole est Member ou Guest
        if (membership.Role == WorkspaceRole.Member && 
            (minimumRole == WorkspaceRole.Member || minimumRole == WorkspaceRole.Guest))
            return true;

        // Guest peut si minimumRole est Guest
        if (membership.Role == WorkspaceRole.Guest && minimumRole == WorkspaceRole.Guest)
            return true;

        return false;
    }

    public async Task<WorkspaceRole?> GetUserRoleAsync(Guid workspaceId, Guid userId)
    {
        var membership = await _workspaceRepository.GetMembershipAsync(workspaceId, userId);
        return membership?.IsActive == true ? membership.Role : null;
    }
}
