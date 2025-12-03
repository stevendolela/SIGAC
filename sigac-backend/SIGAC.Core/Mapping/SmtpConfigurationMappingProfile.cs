using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;

namespace SIGAC.Core.Mapping;

public class SmtpConfigurationMappingProfile : Profile
{
    public SmtpConfigurationMappingProfile()
    {
        CreateMap<SmtpConfiguration, SmtpConfigurationDto>()
            .ForMember(d => d.HasPassword, opt => opt.Ignore()); // Sera défini manuellement
        
        CreateMap<UpdateSmtpConfigurationDto, SmtpConfiguration>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.EncryptedPassword, opt => opt.Ignore()) // Géré manuellement avec chiffrement
            .ForMember(d => d.ModifiedAt, opt => opt.Ignore())
            .ForMember(d => d.ModifiedBy, opt => opt.Ignore())
            .ForMember(d => d.LastTestedAt, opt => opt.Ignore())
            .ForMember(d => d.LastTestSuccess, opt => opt.Ignore())
            .ForMember(d => d.LastTestError, opt => opt.Ignore());
    }
}
