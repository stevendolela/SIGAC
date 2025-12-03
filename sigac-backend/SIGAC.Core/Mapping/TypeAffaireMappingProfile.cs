using AutoMapper;
using SIGAC.Core.Entities;
using SIGAC.Core.DTOs;

namespace SIGAC.Core.Mapping;

public class TypeAffaireMappingProfile : Profile
{
    public TypeAffaireMappingProfile()
    {
        CreateMap<TypeAffaire, TypeAffaireDto>().ReverseMap();
    }
}
