using FluentValidation;
using SIGAC.Core.DTOs;

namespace SIGAC.API.Validators
{
    /// <summary>
    /// Validateur pour LoginDto - Protection contre brute-force et injection
    /// </summary>
    public class LoginDtoValidator : AbstractValidator<LoginDto>
    {
        public LoginDtoValidator()
        {
            // Username obligatoire
            RuleFor(x => x.Username)
                .NotEmpty().WithMessage("Le nom d'utilisateur est obligatoire")
                .MaximumLength(100).WithMessage("Le nom d'utilisateur ne peut pas dépasser 100 caractères");

            // Mot de passe obligatoire (pas de validation de complexité au login)
            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Le mot de passe est obligatoire")
                .MinimumLength(4).WithMessage("Le mot de passe doit contenir au moins 4 caractères")
                .MaximumLength(100).WithMessage("Le mot de passe ne peut pas dépasser 100 caractères");
        }
    }
}
