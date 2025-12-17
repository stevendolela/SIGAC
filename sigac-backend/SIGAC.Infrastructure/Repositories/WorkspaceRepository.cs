using Microsoft.EntityFrameworkCore;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;
using SIGAC.Infrastructure.Data;

namespace SIGAC.Infrastructure.Repositories;

/// <summary>
/// Repository pour la gestion des workspaces
/// </summary>
public class WorkspaceRepository : IWorkspaceRepository
{
    private readonly ApplicationDbContext _context;

    public WorkspaceRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Workspace?> GetByIdAsync(Guid id, bool includeMembers = false, bool includeProjects = false, bool includeOwner = false)
    {
        var query = _context.Workspaces.AsQueryable();

        if (includeMembers)
        {
            query = query.Include(w => w.Members)
                        .ThenInclude(m => m.User);
        }

        if (includeProjects)
        {
            query = query.Include(w => w.Projects);
        }

        if (includeOwner)
        {
            query = query.Include(w => w.Owner);
        }

        return await query.FirstOrDefaultAsync(w => w.Id == id);
    }

    public async Task<Workspace?> GetBySlugAsync(string slug, bool includeMembers = false, bool includeOwner = false)
    {
        var query = _context.Workspaces.AsQueryable();

        if (includeMembers)
        {
            query = query.Include(w => w.Members)
                        .ThenInclude(m => m.User);
        }

        if (includeOwner)
        {
            query = query.Include(w => w.Owner);
        }

        return await query.FirstOrDefaultAsync(w => w.Slug == slug);
    }

    public async Task<List<Workspace>> GetUserWorkspacesAsync(Guid userId)
    {
        return await _context.Workspaces
            .Include(w => w.Owner)
            .Include(w => w.Members.Where(m => m.IsActive))
                .ThenInclude(m => m.User)
            .Include(w => w.Projects)
            .Where(w => w.Members.Any(m => m.UserId == userId && m.IsActive) && w.IsActive)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> SlugExistsAsync(string slug, Guid? excludeWorkspaceId = null)
    {
        var query = _context.Workspaces.Where(w => w.Slug == slug);
        
        if (excludeWorkspaceId.HasValue)
        {
            query = query.Where(w => w.Id != excludeWorkspaceId.Value);
        }

        return await query.AnyAsync();
    }

    public async Task AddAsync(Workspace workspace)
    {
        _context.Workspaces.Add(workspace);
    }

    public async Task UpdateAsync(Workspace workspace)
    {
        _context.Workspaces.Update(workspace);
    }

    public async Task DeleteAsync(Guid id)
    {
        var workspace = await _context.Workspaces.FindAsync(id);
        if (workspace != null)
        {
            _context.Workspaces.Remove(workspace);
        }
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    public async Task<WorkspaceUser?> GetMembershipAsync(Guid workspaceId, Guid userId)
    {
        return await _context.WorkspaceUsers
            .Include(wu => wu.User)
            .Include(wu => wu.Workspace)
            .FirstOrDefaultAsync(wu => wu.WorkspaceId == workspaceId && wu.UserId == userId);
    }

    public async Task<List<WorkspaceUser>> GetWorkspaceMembersAsync(Guid workspaceId, bool includeInactive = false)
    {
        var query = _context.WorkspaceUsers
            .Include(wu => wu.User)
            .Where(wu => wu.WorkspaceId == workspaceId);

        if (!includeInactive)
        {
            query = query.Where(wu => wu.IsActive);
        }

        return await query
            .OrderBy(wu => wu.Role)
            .ThenBy(wu => wu.JoinedAt)
            .ToListAsync();
    }

    public async Task AddMemberAsync(WorkspaceUser member)
    {
        _context.WorkspaceUsers.Add(member);
    }

    public async Task RemoveMemberAsync(Guid workspaceId, Guid userId)
    {
        var member = await _context.WorkspaceUsers
            .FirstOrDefaultAsync(wu => wu.WorkspaceId == workspaceId && wu.UserId == userId);
        
        if (member != null)
        {
            _context.WorkspaceUsers.Remove(member);
        }
    }
}
