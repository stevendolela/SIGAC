using AutoMapper;
using SIGAC.Core.Entities;
using SIGAC.Core.DTOs;

namespace SIGAC.Core.Mapping
{
    public class TenantMappingProfile : Profile
    {
        public TenantMappingProfile()
        {
            // Tenant mappings
            CreateMap<Tenant, TenantDto>().ReverseMap();
            CreateMap<Tenant, TenantListDto>().ReverseMap();
            CreateMap<CreateTenantDto, Tenant>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.DeletedAt, opt => opt.Ignore());

            CreateMap<UpdateTenantDto, Tenant>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.DeletedAt, opt => opt.Ignore())
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Subscription mappings
            CreateMap<TenantSubscription, TenantSubscriptionDto>().ReverseMap();

            // Usage event mappings
            CreateMap<TenantUsageEvent, TenantUsageEventDto>().ReverseMap();
        }
    }
}
