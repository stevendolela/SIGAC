using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;

namespace SIGAC.Core.Mapping;

public class ChatMappingProfile : Profile
{
    public ChatMappingProfile()
    {
        // Message mappings
        CreateMap<Message, MessageDto>()
            .ForMember(d => d.SenderUsername, opt => opt.MapFrom(s => s.Sender != null ? s.Sender.Username : "Unknown"));
        
        CreateMap<CreateMessageDto, Message>();
        
        // ChatConversation mappings
        CreateMap<ChatConversation, ChatConversationDto>()
            .ForMember(d => d.User1Username, opt => opt.MapFrom(s => s.User1 != null ? s.User1.Username : "Unknown"))
            .ForMember(d => d.User2Username, opt => opt.MapFrom(s => s.User2 != null ? s.User2.Username : "Unknown"))
            .ForMember(d => d.UnreadCount, opt => opt.MapFrom(s => s.Messages.Count(m => !m.IsRead)));
        
        CreateMap<ChatConversation, ChatConversationDetailDto>()
            .ForMember(d => d.User1Username, opt => opt.MapFrom(s => s.User1 != null ? s.User1.Username : "Unknown"))
            .ForMember(d => d.User2Username, opt => opt.MapFrom(s => s.User2 != null ? s.User2.Username : "Unknown"))
            .ForMember(d => d.Messages, opt => opt.MapFrom(s => 
                s.Messages.OrderBy(m => m.SentAt)
                    .Select(m => new MessageDto
                    {
                        Id = m.Id,
                        ConversationId = m.ConversationId,
                        SenderId = m.SenderId,
                        SenderUsername = m.Sender != null ? m.Sender.Username : "Unknown",
                        Content = m.Content,
                        SentAt = m.SentAt,
                        IsRead = m.IsRead,
                        ReadAt = m.ReadAt
                    })
            ));

        // ChatGroup mappings
        CreateMap<GroupMessage, GroupMessageDto>()
            .ForMember(d => d.SenderUsername, opt => opt.MapFrom(s => s.Sender != null ? s.Sender.Username : "Unknown"));

        CreateMap<ChatGroupMember, ChatGroupMemberDto>()
            .ForMember(d => d.Username, opt => opt.MapFrom(s => s.User != null ? s.User.Username : "Unknown"))
            .ForMember(d => d.Email, opt => opt.MapFrom(s => s.User != null ? s.User.Email : ""));

        CreateMap<ChatGroup, ChatGroupDto>()
            .ForMember(d => d.CreatedByUsername, opt => opt.MapFrom(s => s.CreatedBy != null ? s.CreatedBy.Username : "Unknown"))
            .ForMember(d => d.MemberCount, opt => opt.MapFrom(s => s.Members.Count))
            .ForMember(d => d.MessageCount, opt => opt.MapFrom(s => s.Messages.Count));

        CreateMap<ChatGroup, ChatGroupDetailDto>()
            .ForMember(d => d.CreatedByUsername, opt => opt.MapFrom(s => s.CreatedBy != null ? s.CreatedBy.Username : "Unknown"))
            .ForMember(d => d.Members, opt => opt.MapFrom(s => s.Members))
            .ForMember(d => d.Messages, opt => opt.MapFrom(s => 
                s.Messages.OrderBy(m => m.SentAt)
                    .Select(m => new GroupMessageDto
                    {
                        Id = m.Id,
                        ChatGroupId = m.ChatGroupId,
                        SenderId = m.SenderId,
                        SenderUsername = m.Sender != null ? m.Sender.Username : "Unknown",
                        Content = m.Content,
                        SentAt = m.SentAt
                    })
            ));
    }
}

