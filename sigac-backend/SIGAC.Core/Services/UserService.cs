using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using System.Security.Cryptography;
using System.Text;

namespace SIGAC.Core.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IMapper _mapper;
    private readonly IPasswordChangeRequestRepository _passwordChangeRequestRepository;
    private readonly IEmailService _emailService;
    private readonly ISmsService _smsService;

    public UserService(
        IUserRepository userRepository,
        IAuditLogRepository auditLogRepository,
        IMapper mapper,
        IPasswordChangeRequestRepository passwordChangeRequestRepository,
        IEmailService emailService,
        ISmsService smsService)
    {
        _userRepository = userRepository;
        _auditLogRepository = auditLogRepository;
        _mapper = mapper;
    _passwordChangeRequestRepository = passwordChangeRequestRepository;
    _emailService = emailService;
    _smsService = smsService;
    }

    public async Task<UserDto?> GetByIdAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        return user != null ? _mapper.Map<UserDto>(user) : null;
    }

    public async Task<UserDto?> GetByUsernameAsync(string username)
    {
        var user = await _userRepository.GetByUsernameAsync(username);
        return user != null ? _mapper.Map<UserDto>(user) : null;
    }

    public async Task<PaginatedResult<UserDto>> GetUsersAsync(int page = 1, int pageSize = 10, string? search = null)
    {
        var result = await _userRepository.GetUsersAsync(page, pageSize, search);
        var userDtos = _mapper.Map<List<UserDto>>(result.Items);
        
        return new PaginatedResult<UserDto>
        {
            Data = userDtos,
            Pagination = result.Pagination
        };
    }

    public async Task<PaginatedResult<UserDto>> GetDeletedUsersAsync(int page = 1, int pageSize = 10, string? search = null)
    {
        var result = await _userRepository.GetDeletedUsersAsync(page, pageSize, search);
        var userDtos = _mapper.Map<List<UserDto>>(result.Items);
        
        return new PaginatedResult<UserDto>
        {
            Data = userDtos,
            Pagination = result.Pagination
        };
    }

    public async Task<UserDto> CreateUserAsync(string username, string email, string passwordHash, UserRole role, Guid createdBy, string? nomComplet = null, string? matricule = null)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = username,
            Email = email,
            PasswordHash = passwordHash,
            Role = role,
            NomComplet = nomComplet,
            Matricule = matricule,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();

        // Sérialiser uniquement les champs primitifs pour éviter les cycles (nav props)
        try
        {
            var createdValues = System.Text.Json.JsonSerializer.Serialize(new
            {
                user.Id,
                user.Username,
                user.Email,
                user.NomComplet,
                Role = user.Role.ToString(),
                user.IsActive,
                user.Matricule,
                user.AvatarUrl,
                user.PhoneNumber,
                user.CreatedAt,
                user.ModifiedAt,
                user.LastLogin,
                user.LastPasswordChange
            });
            await _auditLogRepository.LogActionAsync(
                createdBy, "CREATE", "User", user.Id.ToString(),
                null, createdValues);
        }
        catch
        {
            // Silently fail audit logging to prevent user creation from failing
        }

        return _mapper.Map<UserDto>(user);
    }

    public async Task<bool> UpdateUserAsync(Guid userId, string? email, UserRole? role, string? nomComplet, bool? isActive, string? matricule, Guid updatedBy)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            return false;

        var oldValues = System.Text.Json.JsonSerializer.Serialize(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.NomComplet,
            Role = user.Role.ToString(),
            user.IsActive,
            user.Matricule,
            user.AvatarUrl,
            user.PhoneNumber,
            user.CreatedAt,
            user.ModifiedAt,
            user.LastLogin,
            user.LastPasswordChange
        });

        if (!string.IsNullOrEmpty(email))
            user.Email = email;
        
        if (role.HasValue)
            user.Role = role.Value;

        if (!string.IsNullOrWhiteSpace(nomComplet))
            user.NomComplet = nomComplet!;

        if (isActive.HasValue)
            user.IsActive = isActive.Value;

        if (!string.IsNullOrWhiteSpace(matricule))
            user.Matricule = matricule!;

        user.ModifiedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        var newValues = System.Text.Json.JsonSerializer.Serialize(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.NomComplet,
            Role = user.Role.ToString(),
            user.IsActive,
            user.Matricule,
            user.AvatarUrl,
            user.PhoneNumber,
            user.CreatedAt,
            user.ModifiedAt,
            user.LastLogin,
            user.LastPasswordChange
        });
        await _auditLogRepository.LogActionAsync(
            updatedBy, "UPDATE", "User", userId.ToString(),
            oldValues, newValues);

        return true;
    }

    public async Task<bool> DeleteUserAsync(Guid userId, Guid deletedBy)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            return false;

        // Sérialiser les données avant suppression pour audit complet
        var oldValues = System.Text.Json.JsonSerializer.Serialize(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.NomComplet,
            Role = user.Role.ToString(),
            user.IsActive,
            user.Matricule,
            user.AvatarUrl,
            user.PhoneNumber,
            user.CreatedAt,
            user.ModifiedAt,
            user.LastLogin,
            user.LastPasswordChange,
            DeletedAt = DateTime.UtcNow
        });

        // Soft delete: marquer comme inactif au lieu de supprimer physiquement
        user.IsActive = false;
        user.ModifiedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        // Log l'action de suppression avec trace complète pour audit
        await _auditLogRepository.LogActionAsync(
            deletedBy, "SOFT_DELETE", "User", userId.ToString(),
            oldValues, System.Text.Json.JsonSerializer.Serialize(new
            {
                user.Id,
                user.Username,
                user.IsActive,
                ModifiedAt = user.ModifiedAt,
                DeletedReason = "User disabled via soft delete"
            }));

        return true;
    }

    /// <summary>
    /// Change le password d'un utilisateur après vérification de l'ancien password.
    /// </summary>
    public async Task<bool> ChangePasswordAsync(Guid userId, string oldPassword, string newPassword, Guid changedBy)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            return false;

        // Vérifier que l'ancien password est correct
        if (!BCrypt.Net.BCrypt.Verify(oldPassword, user.PasswordHash))
            return false;

        var oldValues = System.Text.Json.JsonSerializer.Serialize(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.NomComplet,
            Role = user.Role.ToString(),
            user.IsActive,
            user.Matricule,
            user.AvatarUrl,
            user.PhoneNumber,
            user.CreatedAt,
            user.ModifiedAt,
            user.LastLogin,
            user.LastPasswordChange
        });

        // Hash du nouveau password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.ModifiedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        var newValuesPwd = System.Text.Json.JsonSerializer.Serialize(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.NomComplet,
            Role = user.Role.ToString(),
            user.IsActive,
            user.Matricule,
            user.AvatarUrl,
            user.PhoneNumber,
            user.CreatedAt,
            user.ModifiedAt,
            user.LastLogin,
            user.LastPasswordChange
        });
        await _auditLogRepository.LogActionAsync(
            changedBy, "CHANGE_PASSWORD", "User", userId.ToString(),
            oldValues, newValuesPwd);

        return true;
    }

    /// <summary>
    /// Désactive un utilisateur (soft delete).
    /// </summary>
    public async Task<bool> DeactivateUserAsync(Guid userId, Guid deactivatedBy)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            return false;

        var oldValues = System.Text.Json.JsonSerializer.Serialize(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.NomComplet,
            Role = user.Role.ToString(),
            user.IsActive,
            user.Matricule,
            user.AvatarUrl,
            user.PhoneNumber,
            user.CreatedAt,
            user.ModifiedAt,
            user.LastLogin,
            user.LastPasswordChange
        });

        user.IsActive = false;
        user.ModifiedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        var newValuesDeactivate = System.Text.Json.JsonSerializer.Serialize(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.NomComplet,
            Role = user.Role.ToString(),
            user.IsActive,
            user.Matricule,
            user.AvatarUrl,
            user.PhoneNumber,
            user.CreatedAt,
            user.ModifiedAt,
            user.LastLogin,
            user.LastPasswordChange
        });
        await _auditLogRepository.LogActionAsync(
            deactivatedBy, "DEACTIVATE", "User", userId.ToString(),
            oldValues, newValuesDeactivate);

        return true;
    }

    /// <summary>
    /// Réactive un utilisateur désactivé.
    /// </summary>
    public async Task<bool> ActivateUserAsync(Guid userId, Guid activatedBy)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            return false;

        var oldValues = System.Text.Json.JsonSerializer.Serialize(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.NomComplet,
            Role = user.Role.ToString(),
            user.IsActive,
            user.Matricule,
            user.AvatarUrl,
            user.PhoneNumber,
            user.CreatedAt,
            user.ModifiedAt,
            user.LastLogin,
            user.LastPasswordChange
        });

        user.IsActive = true;
        user.ModifiedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        var newValuesActivate = System.Text.Json.JsonSerializer.Serialize(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.NomComplet,
            Role = user.Role.ToString(),
            user.IsActive,
            user.Matricule,
            user.AvatarUrl,
            user.PhoneNumber,
            user.CreatedAt,
            user.ModifiedAt,
            user.LastLogin,
            user.LastPasswordChange
        });
        await _auditLogRepository.LogActionAsync(
            activatedBy, "ACTIVATE", "User", userId.ToString(),
            oldValues, newValuesActivate);

        return true;
    }

    /// <summary>
    /// Vérifie le password d'un utilisateur.
    /// </summary>
    public async Task<bool> VerifyPasswordAsync(Guid userId, string password)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            return false;

        return BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
    }

    /// <summary>
    /// Récupère un utilisateur avec son hash password (pour authentification).
    /// </summary>
    public async Task<(User? User, bool PasswordValid)> GetByUsernameWithPasswordAsync(string username, string password)
    {
        var user = await _userRepository.GetByUsernameAsync(username);
        if (user == null)
            return (null, false);

        var isPasswordValid = BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
        return (user, isPasswordValid);
    }

    public async Task<List<UserDto>> GetJugesAsync()
    {
        var allJuges = await _userRepository.GetByRoleAsync(UserRole.JugeConstitutionnel);
        return _mapper.Map<List<UserDto>>(allJuges);
    }

    public async Task UpdateAvatarAsync(Guid userId, string avatarUrl)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            throw new KeyNotFoundException($"Utilisateur {userId} introuvable");

        var oldAvatar = user.AvatarUrl;
        user.AvatarUrl = avatarUrl;
        user.ModifiedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId,
            "UPDATE_AVATAR",
            "User",
            userId.ToString(),
            oldAvatar ?? "",
            avatarUrl
        );
    }

    public async Task<UserDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            throw new KeyNotFoundException($"Utilisateur {userId} introuvable");

        var oldValues = new { user.NomComplet, user.Email, user.PhoneNumber };

        // Mise à jour des champs
        if (!string.IsNullOrWhiteSpace(dto.NomComplet))
            user.NomComplet = dto.NomComplet.Trim();

        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            // Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
            var existingUser = await _userRepository.GetByEmailAsync(dto.Email);
            if (existingUser != null && existingUser.Id != userId)
                throw new ArgumentException("Cet email est déjà utilisé par un autre utilisateur");

            user.Email = dto.Email.Trim();
        }

        if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
            user.PhoneNumber = dto.PhoneNumber.Trim();

        user.ModifiedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId,
            "UPDATE_PROFILE",
            "User",
            userId.ToString(),
            System.Text.Json.JsonSerializer.Serialize(oldValues),
            System.Text.Json.JsonSerializer.Serialize(new { user.NomComplet, user.Email, user.PhoneNumber })
        );

        return _mapper.Map<UserDto>(user);
    }

    // ===== Gestion des mots de passe avec 2FA =====

    public async Task AdminResetPasswordAsync(AdminResetPasswordDto dto, Guid adminUserId)
    {
        var user = await _userRepository.GetByIdAsync(dto.UserId);
        if (user == null)
            throw new KeyNotFoundException($"Utilisateur {dto.UserId} introuvable");

        // Hash le nouveau mot de passe
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.LastPasswordChange = DateTime.UtcNow;
        user.ModifiedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            adminUserId,
            "ADMIN_RESET_PASSWORD",
            "User",
            user.Id.ToString(),
            "",
            "Mot de passe réinitialisé par admin"
        );

        // Envoyer un email de notification à l'utilisateur
        if (!string.IsNullOrWhiteSpace(user.Email))
        {
            await _emailService.SendAsync(
                user.Email,
                "Réinitialisation de votre mot de passe SIGAC",
                $"Bonjour {user.NomComplet},\n\n" +
                $"Votre mot de passe SIGAC a été réinitialisé par un administrateur.\n" +
                $"Veuillez vous connecter avec votre nouveau mot de passe.\n\n" +
                $"Pour des raisons de sécurité, nous vous recommandons de changer ce mot de passe dès votre prochaine connexion.\n\n" +
                $"Cordialement,\n" +
                $"L'équipe SIGAC"
            );
        }
    }

    public async Task<PasswordChangeCodeDto> RequestPasswordChangeAsync(RequestPasswordChangeDto dto, Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            throw new KeyNotFoundException($"Utilisateur {userId} introuvable");

        // Vérifier l'ancien mot de passe
        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            throw new UnauthorizedAccessException("Le mot de passe actuel est incorrect");

        // Générer un code à 6 chiffres
        var code = GenerateVerificationCode();

        // Hash le nouveau mot de passe pour le stockage temporaire
        var newPasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

        // Créer la requête de changement de mot de passe
        var request = new PasswordChangeRequest
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Code = code,
            NewPasswordHash = newPasswordHash,
            Method = dto.Method,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15), // Code valide 15 minutes
            IsUsed = false
        };

        // Supprimer les anciennes requêtes non utilisées de cet utilisateur
        var oldRequest = await _passwordChangeRequestRepository.GetByUserIdAsync(userId);
        if (oldRequest != null)
        {
            await _passwordChangeRequestRepository.DeleteAsync(oldRequest);
        }

        await _passwordChangeRequestRepository.AddAsync(request);
        await _passwordChangeRequestRepository.SaveChangesAsync();

        // Envoyer le code selon la méthode choisie
        if (dto.Method.ToLower() == "email")
        {
            if (string.IsNullOrWhiteSpace(user.Email))
                throw new ArgumentException("Aucun email configuré pour cet utilisateur");

            // IMPORTANT: Logger le code en développement (à enlever en production!)
            Console.WriteLine($"════════════════════════════════════════════════════════");
            Console.WriteLine($"🔐 CODE DE VÉRIFICATION (DEV): {code}");
            Console.WriteLine($"📧 Pour: {user.Email} ({user.NomComplet})");
            Console.WriteLine($"⏰ Expire dans 15 minutes");
            Console.WriteLine($"════════════════════════════════════════════════════════");

            await _emailService.SendAsync(
                user.Email,
                "Code de vérification SIGAC",
                $"Bonjour {user.NomComplet},\n\n" +
                $"Vous avez demandé à changer votre mot de passe SIGAC.\n\n" +
                $"Votre code de vérification est : {code}\n\n" +
                $"Ce code expire dans 15 minutes.\n\n" +
                $"Si vous n'avez pas demandé ce changement, veuillez ignorer cet email.\n\n" +
                $"Cordialement,\n" +
                $"L'équipe SIGAC"
            );
        }
        else if (dto.Method.ToLower() == "sms")
        {
            if (string.IsNullOrWhiteSpace(user.PhoneNumber))
                throw new ArgumentException("Aucun numéro de téléphone configuré pour cet utilisateur");
            
            // IMPORTANT: Logger le code en développement (à enlever en production!)
            Console.WriteLine($"════════════════════════════════════════════════════════");
            Console.WriteLine($"🔐 CODE DE VÉRIFICATION (DEV): {code}");
            Console.WriteLine($"📱 Pour: {user.PhoneNumber} ({user.NomComplet})");
            Console.WriteLine($"⏰ Expire dans 15 minutes");
            Console.WriteLine($"════════════════════════════════════════════════════════");

            await _smsService.SendVerificationCodeAsync(user.PhoneNumber, code);
        }
        else
        {
            throw new ArgumentException("Méthode invalide. Utilisez 'email' ou 'sms'");
        }

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId,
            "REQUEST_PASSWORD_CHANGE",
            "User",
            userId.ToString(),
            "",
            $"Demande de changement de mot de passe via {dto.Method}"
        );

        return new PasswordChangeCodeDto
        {
            Message = dto.Method.ToLower() == "email" 
                ? $"Un code de vérification a été envoyé à votre adresse email {MaskEmail(user.Email!)}"
                : "Un code de vérification a été envoyé par SMS",
            Method = dto.Method,
            ExpiresAt = request.ExpiresAt
        };
    }

    public async Task<bool> VerifyPasswordChangeAsync(VerifyPasswordChangeDto dto, Guid userId)
    {
        var request = await _passwordChangeRequestRepository.GetByCodeAsync(dto.Code);
        
        if (request == null)
            throw new ArgumentException("Code invalide ou expiré");

        if (request.UserId != userId)
            throw new UnauthorizedAccessException("Ce code n'appartient pas à cet utilisateur");

        // Récupérer l'utilisateur
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            throw new KeyNotFoundException($"Utilisateur {userId} introuvable");

        // Appliquer le nouveau mot de passe
        user.PasswordHash = request.NewPasswordHash;
        user.LastPasswordChange = DateTime.UtcNow;
        user.ModifiedAt = DateTime.UtcNow;

        // Marquer la requête comme utilisée
        request.IsUsed = true;

        _userRepository.Update(user);
        await _passwordChangeRequestRepository.SaveChangesAsync();
        await _userRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId,
            "PASSWORD_CHANGED",
            "User",
            userId.ToString(),
            "",
            "Mot de passe changé avec succès via 2FA"
        );

        // Envoyer un email de confirmation
        if (!string.IsNullOrWhiteSpace(user.Email))
        {
            await _emailService.SendAsync(
                user.Email,
                "Mot de passe SIGAC modifié",
                $"Bonjour {user.NomComplet},\n\n" +
                $"Votre mot de passe SIGAC a été modifié avec succès.\n\n" +
                $"Si vous n'êtes pas à l'origine de ce changement, contactez immédiatement un administrateur.\n\n" +
                $"Cordialement,\n" +
                $"L'équipe SIGAC"
            );
        }

        return true;
    }

    // ===== Méthodes utilitaires privées =====

    private string GenerateVerificationCode()
    {
        // Générer un code numérique à 6 chiffres
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[4];
        rng.GetBytes(bytes);
        var randomNumber = BitConverter.ToUInt32(bytes, 0);
        var code = (randomNumber % 1000000).ToString("D6");
        return code;
    }

    private string MaskEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            return email;

        var parts = email.Split('@');
        var localPart = parts[0];
        var domain = parts[1];

        if (localPart.Length <= 2)
            return $"{localPart[0]}***@{domain}";

        return $"{localPart[0]}***{localPart[^1]}@{domain}";
    }
    
    public async Task<bool> UpdateStatusAsync(Guid userId, UserStatus status)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            throw new KeyNotFoundException("Utilisateur non trouvé");

        var oldStatus = user.Status;
        user.Status = status;
        user.ModifiedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId,
            "UPDATE_STATUS",
            "User",
            userId.ToString(),
            System.Text.Json.JsonSerializer.Serialize(new { Status = oldStatus }),
            System.Text.Json.JsonSerializer.Serialize(new { Status = status })
        );

        return true;
    }
}
