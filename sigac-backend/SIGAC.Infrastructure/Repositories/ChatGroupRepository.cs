using Microsoft.EntityFrameworkCore;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;
using SIGAC.Infrastructure.Data;

namespace SIGAC.Infrastructure.Repositories;

public class ChatGroupRepository : IChatGroupRepository
{
    private readonly ApplicationDbContext _context;

    public ChatGroupRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddGroupAsync(ChatGroup group)
    {
        _context.ChatGroups.Add(group);
    }

    public async Task AddMessageAsync(GroupMessage message)
    {
        _context.GroupMessages.Add(message);
    }

    public async Task AddMemberAsync(ChatGroupMember member)
    {
        _context.ChatGroupMembers.Add(member);
    }

    public async Task RemoveMemberAsync(ChatGroupMember member)
    {
        _context.ChatGroupMembers.Remove(member);
    }

    public async Task DeleteGroupAsync(ChatGroup group)
    {
        // Supprimer les messages, membres et le groupe
        _context.GroupMessages.RemoveRange(group.Messages);
        _context.ChatGroupMembers.RemoveRange(group.Members);
        _context.ChatGroups.Remove(group);
    }

    public async Task<ChatGroup?> GetGroupDetailAsync(Guid groupId)
    {
        return await _context.ChatGroups
            .Include(g => g.Members)
            .ThenInclude(m => m.User)
            .Include(g => g.Messages)
            .ThenInclude(m => m.Sender)
            .Include(g => g.CreatedBy)
            .FirstOrDefaultAsync(g => g.Id == groupId);
    }

    public async Task<IEnumerable<ChatGroup>> GetUserGroupsAsync(Guid userId)
    {
        return await _context.ChatGroups
            .Include(g => g.Members)
            .Include(g => g.CreatedBy)
            .Where(g => g.Members.Any(m => m.UserId == userId))
            .OrderByDescending(g => g.LastMessageAt ?? g.CreatedAt)
            .ToListAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
