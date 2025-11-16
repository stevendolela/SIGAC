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
        CreateMap<Dossier, DossierListDto>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.Priorite, opt => opt.MapFrom(src => src.Priorite.ToString()))
            .ForMember(dest => dest.NombreDocuments, opt => opt.MapFrom(src => src.Documents.Count))
            .ForMember(dest => dest.Rapporteur, opt => opt.MapFrom(src => src.Rapporteur));

        // Map Dossier -> DossierDetailDto (full version with relations)
        CreateMap<Dossier, DossierDetailDto>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.Priorite, opt => opt.MapFrom(src => src.Priorite.ToString()))
            .ForMember(dest => dest.Documents, opt => opt.MapFrom(src => src.Documents))
            .ForMember(dest => dest.Historiques, opt => opt.MapFrom(src => src.Historiques))
            .ForMember(dest => dest.Rapporteur, opt => opt.MapFrom(src => src.Rapporteur));

        // Map Historique -> HistoriqueDto
        CreateMap<Historique, HistoriqueDto>();

        // Map Document -> DocumentDto
        CreateMap<Document, DocumentDto>();

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
