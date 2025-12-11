using SIGAC.Core.Entities;

namespace SIGAC.Core.Interfaces;

public interface IChatGroupRepository
{
    Task AddGroupAsync(ChatGroup group);
    Task AddMessageAsync(GroupMessage message);
    Task AddMemberAsync(ChatGroupMember member);
    Task RemoveMemberAsync(ChatGroupMember member);
    Task DeleteGroupAsync(ChatGroup group);
    Task<ChatGroup?> GetGroupDetailAsync(Guid groupId);
    Task<IEnumerable<ChatGroup>> GetUserGroupsAsync(Guid userId);
    Task SaveChangesAsync();
}
