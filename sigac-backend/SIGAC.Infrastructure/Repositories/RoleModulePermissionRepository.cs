using Microsoft.EntityFrameworkCore;
using SIGAC.Core.Entities;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using SIGAC.Infrastructure.Data;

namespace SIGAC.Infrastructure.Repositories;

/// <summary>
/// Repository pour gérer les permissions rôle-module en base de données
/// </summary>
public class RoleModulePermissionRepository : IRoleModulePermissionRepository
{
    private readonly ApplicationDbContext _context;

    public RoleModulePermissionRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<RoleModulePermission>> GetByRoleAsync(UserRole role, Guid? workspaceId = null)
    {
        var query = _context.RoleModulePermissions.Where(p => p.UserRole == role);
        
        if (workspaceId.HasValue)
            query = query.Where(p => p.WorkspaceId == workspaceId || p.WorkspaceId == null);
        else
            query = query.Where(p => p.WorkspaceId == null);

        return await query.OrderBy(p => p.ModuleKey).ToListAsync();
    }

    public async Task<RoleModulePermission?> GetAsync(UserRole role, string moduleKey, Guid? workspaceId = null)
    {
        var query = _context.RoleModulePermissions
            .Where(p => p.UserRole == role && p.ModuleKey == moduleKey);

        if (workspaceId.HasValue)
            query = query.Where(p => p.WorkspaceId == workspaceId || p.WorkspaceId == null);
        else
            query = query.Where(p => p.WorkspaceId == null);

        return await query.FirstOrDefaultAsync();
    }

    public async Task<List<RoleModulePermission>> GetAllAsync(Guid? workspaceId = null)
    {
        var query = _context.RoleModulePermissions.AsQueryable();

        if (workspaceId.HasValue)
            query = query.Where(p => p.WorkspaceId == workspaceId || p.WorkspaceId == null);
        else
            query = query.Where(p => p.WorkspaceId == null);

        return await query.OrderBy(p => p.ModuleKey).ThenBy(p => p.UserRole).ToListAsync();
    }

    public async Task AddAsync(RoleModulePermission permission)
    {
        permission.Id = Guid.NewGuid();
        permission.CreatedAt = DateTime.UtcNow;
        await _context.RoleModulePermissions.AddAsync(permission);
    }

    public async Task UpdateAsync(RoleModulePermission permission)
    {
        permission.ModifiedAt = DateTime.UtcNow;
        _context.RoleModulePermissions.Update(permission);
        await Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid permissionId)
    {
        var permission = await _context.RoleModulePermissions.FirstOrDefaultAsync(p => p.Id == permissionId);
        if (permission != null)
        {
            _context.RoleModulePermissions.Remove(permission);
        }
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
