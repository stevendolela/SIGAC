using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using System.Text.Json;

namespace SIGAC.Core.Services;

/// <summary>
/// Service métier pour gérer les permissions d'accès aux modules par rôle
/// Gère la matrice complète des droits de la GED (Gestion Électronique des Documents)
/// </summary>
public class RoleModulePermissionService : IRoleModulePermissionService
{
    private readonly IRoleModulePermissionRepository _repository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IMapper _mapper;

    // Configuration des modules applicatifs
    private static readonly List<ModuleDto> DEFAULT_MODULES = new()
    {
        new ModuleDto { Key = "dashboard", Label = "Tableau de Bord", Description = "Accès aux statistiques et KPIs globaux", Icon = "Layout" },
        new ModuleDto { Key = "dossiers", Label = "Projets (Dossiers)", Description = "Gestion et consultation des dossiers métiers", Icon = "Folder" },
        new ModuleDto { Key = "documents", Label = "Documents", Description = "Gestion de la base documentaire et scanner", Icon = "FileText" },
        new ModuleDto { Key = "courriers", Label = "Courriers", Description = "Gestion des flux de courriers entrants/sortants", Icon = "Mail" },
        new ModuleDto { Key = "evenements", Label = "Événements", Description = "Planification des réunions et audiences", Icon = "Calendar" },
        new ModuleDto { Key = "formations", Label = "Formations", Description = "Suivi des formations et participants", Icon = "GraduationCap" },
        new ModuleDto { Key = "equipe", Label = "Équipe", Description = "Consultation des profils professionnels", Icon = "Users" },
        new ModuleDto { Key = "chat", Label = "Messagerie (Chat)", Description = "Communication instantanée entre utilisateurs", Icon = "MessageSquare" },
        new ModuleDto { Key = "admin", Label = "Administration", Description = "Gestion des utilisateurs, logs et configuration système", Icon = "Settings" },
    };

    public RoleModulePermissionService(
        IRoleModulePermissionRepository repository,
        IAuditLogRepository auditLogRepository,
        IMapper mapper)
    {
        _repository = repository;
        _auditLogRepository = auditLogRepository;
        _mapper = mapper;
    }

    public async Task<PermissionsMatrixDto> GetPermissionsMatrixAsync(Guid? workspaceId = null)
    {
        var allPermissions = await _repository.GetAllAsync(workspaceId);

        // Construire la matrice
        var matrix = new PermissionsMatrixDto
        {
            Modules = DEFAULT_MODULES,
            Roles = Enum.GetNames(typeof(UserRole)).ToList()
        };

        foreach (var module in DEFAULT_MODULES)
        {
            var modulePermissions = new Dictionary<string, RolePermissionSummaryDto>();

            foreach (var roleName in matrix.Roles)
            {
                if (Enum.TryParse<UserRole>(roleName, out var role))
                {
                    var perm = allPermissions.FirstOrDefault(p => p.UserRole == role && p.ModuleKey == module.Key);
                    modulePermissions[roleName] = new RolePermissionSummaryDto
                    {
                        HasAccess = perm?.HasAccess ?? GetDefaultAccess(role, module.Key),
                        CanCreate = perm?.CanCreate ?? false,
                        CanUpdate = perm?.CanUpdate ?? false,
                        CanDelete = perm?.CanDelete ?? false,
                        CanExport = perm?.CanExport ?? false
                    };
                }
            }

            matrix.Matrix[module.Key] = modulePermissions;
        }

        return matrix;
    }

    public async Task<List<RoleModulePermissionDto>> GetByRoleAsync(UserRole role, Guid? workspaceId = null)
    {
        var permissions = await _repository.GetByRoleAsync(role, workspaceId);
        return _mapper.Map<List<RoleModulePermissionDto>>(permissions);
    }

    public async Task<RoleModulePermissionDto?> GetPermissionAsync(UserRole role, string moduleKey, Guid? workspaceId = null)
    {
        var permission = await _repository.GetAsync(role, moduleKey, workspaceId);
        return permission == null ? null : _mapper.Map<RoleModulePermissionDto>(permission);
    }

    public async Task<bool> HasAccessAsync(UserRole role, string moduleKey, Guid? workspaceId = null)
    {
        var permission = await _repository.GetAsync(role, moduleKey, workspaceId);
        return permission?.HasAccess ?? GetDefaultAccess(role, moduleKey);
    }

    public async Task<bool> CanPerformActionAsync(UserRole role, string moduleKey, string action, Guid? workspaceId = null)
    {
        var permission = await _repository.GetAsync(role, moduleKey, workspaceId);
        if (permission == null || !permission.HasAccess)
            return false;

        return action.ToLowerInvariant() switch
        {
            "create" => permission.CanCreate,
            "update" => permission.CanUpdate,
            "delete" => permission.CanDelete,
            "export" => permission.CanExport,
            _ => false
        };
    }

    public async Task<RoleModulePermissionDto> UpdatePermissionAsync(
        UserRole role,
        string moduleKey,
        UpdateRoleModulePermissionDto dto,
        Guid userId,
        Guid? workspaceId = null)
    {
        var permission = await _repository.GetAsync(role, moduleKey, workspaceId);

        if (permission == null)
        {
            // Créer une nouvelle permission
            permission = new RoleModulePermission
            {
                UserRole = role,
                ModuleKey = moduleKey,
                ModuleLabel = DEFAULT_MODULES.FirstOrDefault(m => m.Key == moduleKey)?.Label ?? moduleKey,
                Description = DEFAULT_MODULES.FirstOrDefault(m => m.Key == moduleKey)?.Description ?? string.Empty,
                WorkspaceId = workspaceId,
                ConfiguredByUserId = userId
            };
            await _repository.AddAsync(permission);
        }

        // Mise à jour des droits
        var oldValues = JsonSerializer.Serialize(new
        {
            permission.HasAccess,
            permission.CanCreate,
            permission.CanUpdate,
            permission.CanDelete,
            permission.CanExport
        });

        permission.HasAccess = dto.HasAccess;
        permission.CanCreate = dto.CanCreate;
        permission.CanUpdate = dto.CanUpdate;
        permission.CanDelete = dto.CanDelete;
        permission.CanExport = dto.CanExport;
        permission.ConfiguredByUserId = userId;

        await _repository.UpdateAsync(permission);
        await _repository.SaveChangesAsync();

        // Audit logging
        var newValues = JsonSerializer.Serialize(new
        {
            permission.HasAccess,
            permission.CanCreate,
            permission.CanUpdate,
            permission.CanDelete,
            permission.CanExport
        });

        await _auditLogRepository.LogActionAsync(
            userId,
            "UPDATE",
            nameof(RoleModulePermission),
            $"{role}:{moduleKey}",
            oldValues,
            newValues
        );

        return _mapper.Map<RoleModulePermissionDto>(permission);
    }

    public async Task<List<RoleModulePermissionDto>> UpdateBatchAsync(
        List<(UserRole role, string moduleKey, UpdateRoleModulePermissionDto dto)> updates,
        Guid userId,
        Guid? workspaceId = null)
    {
        var results = new List<RoleModulePermissionDto>();

        foreach (var (role, moduleKey, dto) in updates)
        {
            var result = await UpdatePermissionAsync(role, moduleKey, dto, userId, workspaceId);
            results.Add(result);
        }

        return results;
    }

    public async Task InitializeDefaultPermissionsAsync(Guid? workspaceId = null)
    {
        var existingPermissions = await _repository.GetAllAsync(workspaceId);

        foreach (var role in Enum.GetValues(typeof(UserRole)).Cast<UserRole>())
        {
            foreach (var module in DEFAULT_MODULES)
            {
                var existing = existingPermissions.FirstOrDefault(p => p.UserRole == role && p.ModuleKey == module.Key);
                if (existing == null)
                {
                    var permission = new RoleModulePermission
                    {
                        UserRole = role,
                        ModuleKey = module.Key,
                        ModuleLabel = module.Label,
                        Description = module.Description,
                        HasAccess = GetDefaultAccess(role, module.Key),
                        CanCreate = GetDefaultCanCreate(role),
                        CanUpdate = GetDefaultCanUpdate(role),
                        CanDelete = GetDefaultCanDelete(role),
                        CanExport = GetDefaultCanExport(role),
                        WorkspaceId = workspaceId
                    };
                    await _repository.AddAsync(permission);
                }
            }
        }

        await _repository.SaveChangesAsync();
    }

    public async Task<string> ExportMatrixAsJsonAsync(Guid? workspaceId = null)
    {
        var matrix = await GetPermissionsMatrixAsync(workspaceId);
        return JsonSerializer.Serialize(matrix, new JsonSerializerOptions { WriteIndented = true });
    }

    public async Task ImportMatrixFromJsonAsync(string json, Guid userId, Guid? workspaceId = null)
    {
        try
        {
            var matrix = JsonSerializer.Deserialize<PermissionsMatrixDto>(json);
            if (matrix == null || matrix.Matrix.Count == 0)
                throw new ArgumentException("JSON invalide ou vide");

            var updates = new List<(UserRole, string, UpdateRoleModulePermissionDto)>();

            foreach (var (moduleKey, rolePermissions) in matrix.Matrix)
            {
                foreach (var (roleName, summary) in rolePermissions)
                {
                    if (Enum.TryParse<UserRole>(roleName, out var role))
                    {
                        updates.Add((role, moduleKey, new UpdateRoleModulePermissionDto
                        {
                            HasAccess = summary.HasAccess,
                            CanCreate = summary.CanCreate,
                            CanUpdate = summary.CanUpdate,
                            CanDelete = summary.CanDelete,
                            CanExport = summary.CanExport
                        }));
                    }
                }
            }

            await UpdateBatchAsync(updates, userId, workspaceId);
        }
        catch (Exception ex)
        {
            throw;
        }
    }

    // Méthodes privées pour les valeurs par défaut
    private static bool GetDefaultAccess(UserRole role, string moduleKey)
    {
        return role switch
        {
            UserRole.Admin => true,
            UserRole.Manager => true,
            UserRole.Collaborateur => moduleKey switch
            {
                "admin" => false,
                _ => true
            },
            UserRole.Assistant => moduleKey switch
            {
                "admin" => false,
                "formations" => false,
                _ => true
            },
            UserRole.AssistantJunior => moduleKey switch
            {
                "admin" => false,
                "formations" => false,
                "courriers" => false,
                _ => true
            },
            UserRole.Consultant => moduleKey switch
            {
                "dashboard" => true,
                "dossiers" => true,
                "evenements" => true,
                "equipe" => true,
                "chat" => true,
                _ => false
            },
            _ => false
        };
    }

    private static bool GetDefaultCanCreate(UserRole role)
    {
        return role switch
        {
            UserRole.Admin or UserRole.Manager or UserRole.Collaborateur => true,
            UserRole.Assistant or UserRole.AssistantJunior => true,
            _ => false
        };
    }

    private static bool GetDefaultCanUpdate(UserRole role)
    {
        return role switch
        {
            UserRole.Admin or UserRole.Manager or UserRole.Collaborateur => true,
            UserRole.Assistant => true,
            UserRole.AssistantJunior => false,
            _ => false
        };
    }

    private static bool GetDefaultCanDelete(UserRole role)
    {
        return role switch
        {
            UserRole.Admin or UserRole.Manager => true,
            UserRole.Collaborateur => false,
            _ => false
        };
    }

    private static bool GetDefaultCanExport(UserRole role)
    {
        return role switch
        {
            UserRole.Admin or UserRole.Manager or UserRole.Collaborateur => true,
            UserRole.Assistant => false,
            _ => false
        };
    }
}
