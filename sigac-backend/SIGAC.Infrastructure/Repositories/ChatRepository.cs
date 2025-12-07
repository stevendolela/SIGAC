using Microsoft.EntityFrameworkCore;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;
using SIGAC.Infrastructure.Data;

namespace SIGAC.Infrastructure.Repositories;

public class ChatRepository : IChatRepository
{
    private readonly ApplicationDbContext _context;

    public ChatRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ChatConversation>> GetUserConversationsAsync(Guid userId)
    {
        return await _context.ChatConversations
            .Where(c => c.User1Id == userId || c.User2Id == userId)
            .Include(c => c.User1)
            .Include(c => c.User2)
            .Include(c => c.Messages)
                .ThenInclude(m => m.Sender)
            .OrderByDescending(c => c.LastMessageAt ?? c.CreatedAt)
            .ToListAsync();
    }

    public async Task<ChatConversation?> GetConversationByIdAsync(Guid conversationId)
    {
        return await _context.ChatConversations
            .Where(c => c.Id == conversationId)
            .Include(c => c.User1)
            .Include(c => c.User2)
            .Include(c => c.Messages)
                .ThenInclude(m => m.Sender)
            .FirstOrDefaultAsync();
    }

    public async Task<ChatConversation?> GetConversationBetweenUsersAsync(Guid user1Id, Guid user2Id)
    {
        return await _context.ChatConversations
            .Where(c => 
                (c.User1Id == user1Id && c.User2Id == user2Id) ||
                (c.User1Id == user2Id && c.User2Id == user1Id))
            .Include(c => c.User1)
            .Include(c => c.User2)
            .Include(c => c.Messages)
                .ThenInclude(m => m.Sender)
            .FirstOrDefaultAsync();
    }

    public async Task AddConversationAsync(ChatConversation conversation)
    {
        await _context.ChatConversations.AddAsync(conversation);
    }

    public async Task AddMessageAsync(Message message)
    {
        await _context.Messages.AddAsync(message);
    }

    public async Task UpdateMessageAsync(Message message)
    {
        _context.Messages.Update(message);
        await Task.CompletedTask;
    }

    public async Task DeleteConversationAsync(ChatConversation conversation)
    {
        _context.ChatConversations.Remove(conversation);
        await Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
