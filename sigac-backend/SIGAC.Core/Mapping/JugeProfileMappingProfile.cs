using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;

namespace SIGAC.Core.Mapping;

public class JugeProfileMappingProfile : Profile
{
    public JugeProfileMappingProfile()
    {
        // JugeProfile → JugeProfileDto
        CreateMap<JugeProfile, JugeProfileDto>()
            .ReverseMap();

        // CreateJugeProfileDto → JugeProfile
        CreateMap<CreateJugeProfileDto, JugeProfile>();

        // UpdateJugeProfileDto → JugeProfile  
        CreateMap<UpdateJugeProfileDto, JugeProfile>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
    }
}
