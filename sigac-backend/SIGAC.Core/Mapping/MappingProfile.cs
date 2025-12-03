using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;

namespace SIGAC.Core.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Map User -> UserDto, convert enum Role to string
        CreateMap<User, UserDto>()
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role.ToString()));

        // Map Dossier -> DossierListDto (lean version without relations)
        // Mapping Dossier → DossierListDto et DossierDetailDto est géré dans DossierMappingProfile.cs

        // Map Historique -> HistoriqueDto
        CreateMap<Historique, HistoriqueDto>();

        // Map Document -> DocumentDto
        CreateMap<Document, DocumentDto>();

        // Map Notification -> NotificationDto
        CreateMap<Notification, NotificationDto>();

        // Map CreateDossierDto -> Dossier (for reverse mapping)
        CreateMap<CreateDossierDto, Dossier>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.ModifiedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Documents, opt => opt.Ignore())
            .ForMember(dest => dest.Historiques, opt => opt.Ignore());

        // Map UpdateDossierDto -> Dossier (for reverse mapping)
        CreateMap<UpdateDossierDto, Dossier>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.ModifiedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Documents, opt => opt.Ignore())
            .ForMember(dest => dest.Historiques, opt => opt.Ignore());
    }
}
