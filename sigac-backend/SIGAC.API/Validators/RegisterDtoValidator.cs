using FluentValidation;
using SIGAC.Core.DTOs;

namespace SIGAC.API.Validators
{
    /// <summary>
    /// Validateur pour CreateUserDto - Politique de mot de passe stricte
    /// </summary>
    public class RegisterDtoValidator : AbstractValidator<CreateUserDto>
    {
        public RegisterDtoValidator()
        {
            // Nom d'utilisateur
            RuleFor(x => x.Username)
                .NotEmpty().WithMessage("Le nom d'utilisateur est obligatoire")
                .MinimumLength(3).WithMessage("Le nom d'utilisateur doit contenir au moins 3 caractères")
                .MaximumLength(50).WithMessage("Le nom d'utilisateur ne peut pas dépasser 50 caractères")
                .Matches(@"^[a-zA-Z0-9._-]+$").WithMessage("Le nom d'utilisateur ne peut contenir que des lettres, chiffres, points, tirets et underscores");

            // Email
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("L'email est obligatoire")
                .EmailAddress().WithMessage("Format d'email invalide")
                .MaximumLength(100).WithMessage("L'email ne peut pas dépasser 100 caractères");

            // Mot de passe - Politique stricte
            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Le mot de passe est obligatoire")
                .MinimumLength(8).WithMessage("Le mot de passe doit contenir au moins 8 caractères")
                .MaximumLength(100).WithMessage("Le mot de passe ne peut pas dépasser 100 caractères")
                .Matches(@"[A-Z]").WithMessage("Le mot de passe doit contenir au moins une lettre majuscule")
                .Matches(@"[a-z]").WithMessage("Le mot de passe doit contenir au moins une lettre minuscule")
                .Matches(@"[0-9]").WithMessage("Le mot de passe doit contenir au moins un chiffre")
                .Matches(@"[^a-zA-Z0-9]").WithMessage("Le mot de passe doit contenir au moins un caractère spécial");

            // Prénom - Optionnel (pas dans CreateUserDto)
            // RuleFor(x => x.FirstName)
            //     .NotEmpty().WithMessage("Le prénom est obligatoire")
            //     .MaximumLength(50).WithMessage("Le prénom ne peut pas dépasser 50 caractères")
            //     .Matches(@"^[a-zA-ZÀ-ÿ\s'-]+$").WithMessage("Le prénom contient des caractères invalides");

            // Nom de famille - Optionnel (pas dans CreateUserDto)
            // RuleFor(x => x.LastName)
            //     .NotEmpty().WithMessage("Le nom de famille est obligatoire")
            //     .MaximumLength(50).WithMessage("Le nom de famille ne peut pas dépasser 50 caractères")
            //     .Matches(@"^[a-zA-ZÀ-ÿ\s'-]+$").WithMessage("Le nom de famille contient des caractères invalides");

            // Nom complet (optionnel)
            RuleFor(x => x.NomComplet)
                .MaximumLength(100).WithMessage("Le nom complet ne peut pas dépasser 100 caractères")
                .When(x => !string.IsNullOrEmpty(x.NomComplet));

            // Matricule (optionnel)
            RuleFor(x => x.Matricule)
                .MaximumLength(50).WithMessage("Le matricule ne peut pas dépasser 50 caractères")
                .When(x => !string.IsNullOrEmpty(x.Matricule));

            // Rôle
            RuleFor(x => x.Role)
                .NotEmpty().WithMessage("Le rôle est obligatoire")
                .IsInEnum().WithMessage("Le rôle spécifié n'est pas valide");
        }
    }
}
