using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;

namespace SIGAC.Core.Mapping;

/// <summary>
/// AutoMapper profile pour les entités Workspace
/// </summary>
public class WorkspaceMappingProfile : Profile
{
    public WorkspaceMappingProfile()
    {
        // Workspace → WorkspaceDto
        CreateMap<Workspace, WorkspaceDto>()
            .ForMember(d => d.OwnerName, 
                opt => opt.MapFrom(s => s.Owner.NomComplet ?? s.Owner.Username))
            .ForMember(d => d.CurrentMemberCount, 
                opt => opt.MapFrom(s => s.Members.Count(m => m.IsActive)))
            .ForMember(d => d.CurrentProjectCount, 
                opt => opt.MapFrom(s => s.Projects.Count))
            .ForMember(d => d.UserRole, 
                opt => opt.Ignore()); // Set manually in service based on current user
        
        // CreateWorkspaceDto → Workspace
        CreateMap<CreateWorkspaceDto, Workspace>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow))
            .ForMember(d => d.IsActive, opt => opt.MapFrom(_ => true));
        
        // WorkspaceUser → WorkspaceMemberDto
        CreateMap<WorkspaceUser, WorkspaceMemberDto>()
            .ForMember(d => d.Username, opt => opt.MapFrom(s => s.User.Username))
            .ForMember(d => d.Email, opt => opt.MapFrom(s => s.User.Email))
            .ForMember(d => d.NomComplet, opt => opt.MapFrom(s => s.User.NomComplet ?? s.User.Username))
            .ForMember(d => d.InvitedById, opt => opt.MapFrom(s => s.InvitedBy))
            .ForMember(d => d.InvitedByName, opt => opt.Ignore()); // Can be populated separately if needed
    }
}
