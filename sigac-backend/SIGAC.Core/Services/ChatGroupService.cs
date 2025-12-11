using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;

namespace SIGAC.Core.Services;

public interface IChatGroupService
{
    Task<ChatGroupDto> CreateGroupAsync(CreateChatGroupDto dto, Guid userId);
    Task<IEnumerable<ChatGroupDto>> GetUserGroupsAsync(Guid userId);
    Task<ChatGroupDetailDto?> GetGroupDetailAsync(Guid groupId, Guid userId);
    Task<GroupMessageDto> AddMessageAsync(CreateGroupMessageDto dto, Guid userId);
    Task AddMemberAsync(Guid groupId, Guid memberId, Guid userId);
    Task RemoveMemberAsync(Guid groupId, Guid memberId, Guid userId);
    Task DeleteGroupAsync(Guid groupId, Guid userId);
}

public class ChatGroupService : IChatGroupService
{
    private readonly IChatGroupRepository _groupRepository;
    private readonly IMapper _mapper;

    public ChatGroupService(
        IChatGroupRepository groupRepository,
        IMapper mapper)
    {
        _groupRepository = groupRepository;
        _mapper = mapper;
    }

    public async Task<ChatGroupDto> CreateGroupAsync(CreateChatGroupDto dto, Guid userId)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new ArgumentException("Le nom du groupe est requis");

        var memberIds = dto.MemberIds?.ToList() ?? new List<Guid>();
        if (memberIds.Count < 1)
            throw new ArgumentException("Au moins un membre est requis en plus du créateur");

        // Créer le groupe
        var group = new ChatGroup
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Description = dto.Description,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow
        };

        // Ajouter le créateur comme admin
        group.Members.Add(new ChatGroupMember
        {
            Id = Guid.NewGuid(),
            ChatGroup = group,
            UserId = userId,
            JoinedAt = DateTime.UtcNow,
            IsAdmin = true
        });

        // Ajouter les autres membres
        foreach (var memberId in memberIds)
        {
            if (memberId != userId) // Éviter de re-ajouter le créateur
            {
                group.Members.Add(new ChatGroupMember
                {
                    Id = Guid.NewGuid(),
                    ChatGroup = group,
                    UserId = memberId,
                    JoinedAt = DateTime.UtcNow,
                    IsAdmin = false
                });
            }
        }

        await _groupRepository.AddGroupAsync(group);
        await _groupRepository.SaveChangesAsync();

        return _mapper.Map<ChatGroupDto>(group);
    }

    public async Task<IEnumerable<ChatGroupDto>> GetUserGroupsAsync(Guid userId)
    {
        var groups = await _groupRepository.GetUserGroupsAsync(userId);
        return _mapper.Map<IEnumerable<ChatGroupDto>>(groups);
    }

    public async Task<ChatGroupDetailDto?> GetGroupDetailAsync(Guid groupId, Guid userId)
    {
        var group = await _groupRepository.GetGroupDetailAsync(groupId);
        if (group == null)
            return null;

        // Vérifier que l'utilisateur est membre du groupe
        if (!group.Members.Any(m => m.UserId == userId))
            throw new UnauthorizedAccessException("Vous n'êtes pas membre de ce groupe");

        return _mapper.Map<ChatGroupDetailDto>(group);
    }

    public async Task<GroupMessageDto> AddMessageAsync(CreateGroupMessageDto dto, Guid userId)
    {
        var group = await _groupRepository.GetGroupDetailAsync(dto.ChatGroupId);
        if (group == null)
            throw new KeyNotFoundException("Groupe non trouvé");

        // Vérifier que l'utilisateur est membre du groupe
        if (!group.Members.Any(m => m.UserId == userId))
            throw new UnauthorizedAccessException("Vous n'êtes pas membre de ce groupe");

        if (string.IsNullOrWhiteSpace(dto.Content))
            throw new ArgumentException("Le message ne peut pas être vide");

        var message = new GroupMessage
        {
            Id = Guid.NewGuid(),
            ChatGroupId = dto.ChatGroupId,
            SenderId = userId,
            Content = dto.Content,
            SentAt = DateTime.UtcNow
        };

        // Mettre à jour LastMessageAt du groupe
        group.LastMessageAt = DateTime.UtcNow;

        await _groupRepository.AddMessageAsync(message);
        await _groupRepository.SaveChangesAsync();

        return _mapper.Map<GroupMessageDto>(message);
    }

    public async Task AddMemberAsync(Guid groupId, Guid memberId, Guid userId)
    {
        var group = await _groupRepository.GetGroupDetailAsync(groupId);
        if (group == null)
            throw new KeyNotFoundException("Groupe non trouvé");

        // Vérifier que l'utilisateur est admin du groupe
        var userMember = group.Members.FirstOrDefault(m => m.UserId == userId);
        if (userMember == null || !userMember.IsAdmin)
            throw new UnauthorizedAccessException("Vous devez être admin pour ajouter des membres");

        // Vérifier qu'il n'est pas déjà membre
        if (group.Members.Any(m => m.UserId == memberId))
            throw new ArgumentException("L'utilisateur est déjà membre du groupe");

        var member = new ChatGroupMember
        {
            Id = Guid.NewGuid(),
            ChatGroupId = groupId,
            UserId = memberId,
            JoinedAt = DateTime.UtcNow,
            IsAdmin = false
        };

        await _groupRepository.AddMemberAsync(member);
        await _groupRepository.SaveChangesAsync();
    }

    public async Task RemoveMemberAsync(Guid groupId, Guid memberId, Guid userId)
    {
        var group = await _groupRepository.GetGroupDetailAsync(groupId);
        if (group == null)
            throw new KeyNotFoundException("Groupe non trouvé");

        // Vérifier que l'utilisateur est admin du groupe ou supprime lui-même
        var userMember = group.Members.FirstOrDefault(m => m.UserId == userId);
        if (userMember == null)
            throw new UnauthorizedAccessException("Vous n'êtes pas membre de ce groupe");

        if (userId != memberId && !userMember.IsAdmin)
            throw new UnauthorizedAccessException("Vous n'avez pas la permission de supprimer ce membre");

        var memberToRemove = group.Members.FirstOrDefault(m => m.UserId == memberId);
        if (memberToRemove == null)
            throw new KeyNotFoundException("Membre non trouvé");

        await _groupRepository.RemoveMemberAsync(memberToRemove);
        await _groupRepository.SaveChangesAsync();
    }

    public async Task DeleteGroupAsync(Guid groupId, Guid userId)
    {
        var group = await _groupRepository.GetGroupDetailAsync(groupId);
        if (group == null)
            throw new KeyNotFoundException("Groupe non trouvé");

        // Vérifier que l'utilisateur est créateur du groupe
        if (group.CreatedById != userId)
            throw new UnauthorizedAccessException("Seul le créateur peut supprimer le groupe");

        await _groupRepository.DeleteGroupAsync(group);
        await _groupRepository.SaveChangesAsync();
    }
}
