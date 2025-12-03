using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;

namespace SIGAC.Core.Mapping
{
    public class DossierMappingProfile : Profile
    {
        public DossierMappingProfile()
        {
            // Mapping Dossier → DossierDto (simple mapping)
                CreateMap<Dossier, DossierDto>()
                    .ForMember(dest => dest.TypeAffaireId, opt => opt.MapFrom(src => src.TypeAffaireId))
                    .ForMember(dest => dest.TypeAffaireNom, opt => opt.MapFrom(src => src.TypeAffaire != null ? src.TypeAffaire.Nom : null))
                    .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
                    .ForMember(dest => dest.Priorite, opt => opt.MapFrom(src => src.Priorite.ToString()))
                    .ForMember(dest => dest.RapporteurNom, opt => opt.MapFrom(src => src.Rapporteur != null ? src.Rapporteur.NomComplet : null));

                // Mapping Dossier → DossierListDto
                CreateMap<Dossier, DossierListDto>()
                    .ForMember(dest => dest.Rapporteur, opt => opt.MapFrom(src => src.Rapporteur))
                    .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.TypeAffaire != null ? src.TypeAffaire.Nom : string.Empty))
                    .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
                    .ForMember(dest => dest.Priorite, opt => opt.MapFrom(src => src.Priorite.ToString()))
                    .ForMember(dest => dest.NombreDocuments, opt => opt.MapFrom(src => src.Documents != null ? src.Documents.Count : 0));

                // Mapping Dossier → DossierDetailDto
                CreateMap<Dossier, DossierDetailDto>()
                    .ForMember(dest => dest.Rapporteur, opt => opt.MapFrom(src => src.Rapporteur))
                    .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.TypeAffaire != null ? src.TypeAffaire.Nom : string.Empty))
                    .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
                    .ForMember(dest => dest.Priorite, opt => opt.MapFrom(src => src.Priorite.ToString()))
                    .ForMember(dest => dest.Documents, opt => opt.MapFrom(src => src.Documents))
                    .ForMember(dest => dest.Historiques, opt => opt.MapFrom(src => src.Historiques));

            // Reverse mappings (si nécessaire)
            CreateMap<CreateDossierDto, Dossier>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.ModifiedAt, opt => opt.Ignore())
                .ForMember(dest => dest.Rapporteur, opt => opt.Ignore())
                .ForMember(dest => dest.Documents, opt => opt.Ignore())
                .ForMember(dest => dest.Historiques, opt => opt.Ignore());

            CreateMap<UpdateDossierDto, Dossier>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.ModifiedAt, opt => opt.Ignore())
                .ForMember(dest => dest.Rapporteur, opt => opt.Ignore())
                .ForMember(dest => dest.Documents, opt => opt.Ignore())
                .ForMember(dest => dest.Historiques, opt => opt.Ignore());
        }
    }
}
