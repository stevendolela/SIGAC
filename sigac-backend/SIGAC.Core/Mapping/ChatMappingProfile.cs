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
            .ForMember(d => d.SenderUsername, opt => opt.MapFrom(s => s.Sender != null ? s.Sender.Username : "Unknown"))
            .ForMember(d => d.SenderNomComplet, opt => opt.MapFrom(s => s.Sender != null ? s.Sender.NomComplet : null))
            .ForMember(d => d.SenderStatus, opt => opt.MapFrom(s => s.Sender != null ? (Enums.UserStatus?)s.Sender.Status : null))
            .ForMember(d => d.Attachments, opt => opt.MapFrom((src, dest, destMember, context) => 
                context.Items.ContainsKey("Attachments") ? context.Items["Attachments"] : new List<ChatAttachmentDto>()));
        
        CreateMap<CreateMessageDto, Message>();
        
        // ChatConversation mappings
        CreateMap<ChatConversation, ChatConversationDto>()
            .ForMember(d => d.User1Username, opt => opt.MapFrom(s => s.User1 != null ? s.User1.Username : "Unknown"))
            .ForMember(d => d.User1NomComplet, opt => opt.MapFrom(s => s.User1 != null ? s.User1.NomComplet : null))
            .ForMember(d => d.User1Status, opt => opt.MapFrom(s => s.User1 != null ? (Enums.UserStatus?)s.User1.Status : null))
            .ForMember(d => d.User2Username, opt => opt.MapFrom(s => s.User2 != null ? s.User2.Username : "Unknown"))
            .ForMember(d => d.User2NomComplet, opt => opt.MapFrom(s => s.User2 != null ? s.User2.NomComplet : null))
            .ForMember(d => d.User2Status, opt => opt.MapFrom(s => s.User2 != null ? (Enums.UserStatus?)s.User2.Status : null))
            .ForMember(d => d.UnreadCount, opt => opt.MapFrom(s => s.Messages.Count(m => !m.IsRead)));
        
        CreateMap<ChatConversation, ChatConversationDetailDto>()
            .ForMember(d => d.User1Username, opt => opt.MapFrom(s => s.User1 != null ? s.User1.Username : "Unknown"))
            .ForMember(d => d.User1NomComplet, opt => opt.MapFrom(s => s.User1 != null ? s.User1.NomComplet : null))
            .ForMember(d => d.User1Status, opt => opt.MapFrom(s => s.User1 != null ? (Enums.UserStatus?)s.User1.Status : null))
            .ForMember(d => d.User2Username, opt => opt.MapFrom(s => s.User2 != null ? s.User2.Username : "Unknown"))
            .ForMember(d => d.User2NomComplet, opt => opt.MapFrom(s => s.User2 != null ? s.User2.NomComplet : null))
            .ForMember(d => d.User2Status, opt => opt.MapFrom(s => s.User2 != null ? (Enums.UserStatus?)s.User2.Status : null))
            .ForMember(d => d.Messages, opt => opt.MapFrom(s => 
                s.Messages.OrderBy(m => m.SentAt)
                    .Select(m => new MessageDto
                    {
                        Id = m.Id,
                        ConversationId = m.ConversationId,
                        SenderId = m.SenderId,
                        SenderUsername = m.Sender != null ? m.Sender.Username : "Unknown",
                        SenderNomComplet = m.Sender != null ? m.Sender.NomComplet : null,
                        SenderStatus = m.Sender != null ? (Enums.UserStatus?)m.Sender.Status : null,
                        Content = m.Content,
                        SentAt = m.SentAt,
                        IsRead = m.IsRead,
                        ReadAt = m.ReadAt
                    })
            ));

        // ChatGroup mappings
        CreateMap<GroupMessage, GroupMessageDto>()
            .ForMember(d => d.SenderUsername, opt => opt.MapFrom(s => s.Sender != null ? s.Sender.Username : "Unknown"))
            .ForMember(d => d.SenderNomComplet, opt => opt.MapFrom(s => s.Sender != null ? s.Sender.NomComplet : null))
            .ForMember(d => d.SenderStatus, opt => opt.MapFrom(s => s.Sender != null ? (Enums.UserStatus?)s.Sender.Status : null));

        CreateMap<ChatGroupMember, ChatGroupMemberDto>()
            .ForMember(d => d.Username, opt => opt.MapFrom(s => s.User != null ? s.User.Username : "Unknown"))
            .ForMember(d => d.NomComplet, opt => opt.MapFrom(s => s.User != null ? s.User.NomComplet : null))
            .ForMember(d => d.Status, opt => opt.MapFrom(s => s.User != null ? (Enums.UserStatus?)s.User.Status : null))
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
                        SenderNomComplet = m.Sender != null ? m.Sender.NomComplet : null,
                        SenderStatus = m.Sender != null ? (Enums.UserStatus?)m.Sender.Status : null,
                        Content = m.Content,
                        SentAt = m.SentAt
                    })
            ));

        // ChatAttachment mappings
        CreateMap<ChatAttachment, ChatAttachmentDto>()
            .ForMember(d => d.UploaderUsername, opt => opt.MapFrom(s => s.Uploader != null ? s.Uploader.Username : "Unknown"))
            .ForMember(d => d.DownloadUrl, opt => opt.MapFrom(s => $"/api/chat/attachments/{s.Id}/download"));
    }
}

