using FluentValidation;
using SIGAC.Core.DTOs;

namespace SIGAC.API.Validators
{
    /// <summary>
    /// Validateur pour CreateDossierDto - Protection contre injection et données malformées
    /// </summary>
    public class CreateDossierDtoValidator : AbstractValidator<CreateDossierDto>
    {
        public CreateDossierDtoValidator()
        {
            // Titre
            RuleFor(x => x.Titre)
                .NotEmpty().WithMessage("Le titre est obligatoire")
                .MinimumLength(10).WithMessage("Le titre doit contenir au moins 10 caractères")
                .MaximumLength(500).WithMessage("Le titre ne peut pas dépasser 500 caractères");

            // Type d'affaire ID
            RuleFor(x => x.TypeAffaireId)
                .NotEmpty().WithMessage("Le type d'affaire est obligatoire")
                .NotEqual(Guid.Empty).WithMessage("Le type d'affaire est invalide");

            // Demandeur
            RuleFor(x => x.Demandeur)
                .NotEmpty().WithMessage("Le demandeur est obligatoire")
                .MinimumLength(3).WithMessage("Le demandeur doit contenir au moins 3 caractères")
                .MaximumLength(200).WithMessage("Le demandeur ne peut pas dépasser 200 caractères");

            // Défendeur (optionnel)
            RuleFor(x => x.Defendeur)
                .MaximumLength(200).WithMessage("Le défendeur ne peut pas dépasser 200 caractères")
                .When(x => !string.IsNullOrEmpty(x.Defendeur));

            // Priorité
            RuleFor(x => x.Priorite)
                .IsInEnum().WithMessage("La priorité spécifiée n'est pas valide");

            // Résumé (optionnel)
            RuleFor(x => x.Resume)
                .MaximumLength(2000).WithMessage("Le résumé ne peut pas dépasser 2000 caractères")
                .When(x => !string.IsNullOrEmpty(x.Resume));
        }
    }
}
