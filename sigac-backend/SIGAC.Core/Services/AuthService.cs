using AutoMapper;
using BCrypt.Net;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace SIGAC.Core.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IConfiguration _configuration;
    private readonly IMapper _mapper;

    public AuthService(
        IUserRepository userRepository,
        IAuditLogRepository auditLogRepository,
        IConfiguration configuration,
        IMapper mapper)
    {
        _userRepository = userRepository;
        _auditLogRepository = auditLogRepository;
        _configuration = configuration;
        _mapper = mapper;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginDto loginDto, string ipAddress, string userAgent)
    {
        // Récupérer l'utilisateur par username
        var user = await _userRepository.GetByUsernameAsync(loginDto.Username);

        if (user == null || !user.IsActive)
        {
            // Log de tentative échouée
            await _auditLogRepository.LogActionAsync(
                null, "LOGIN_FAILED", "User", null, null, null, ipAddress, userAgent);
            return null;
        }

        // Vérifier le mot de passe
        if (!VerifyPassword(loginDto.Password, user.PasswordHash))
        {
            await _auditLogRepository.LogActionAsync(
                user.Id, "LOGIN_FAILED", "User", user.Id.ToString(), null, null, ipAddress, userAgent);
            return null;
        }

        // Générer les tokens
        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();

        // Debug: log token length so tests can show if generation failed
        try
        {
            Console.WriteLine($"[AuthService] Generated JWT length: {(token?.Length ?? 0)}");
            // Print prefix to avoid exposing full token in logs
            Console.WriteLine($"[AuthService] JWT preview: {token?.Substring(0, Math.Min(50, token.Length))}");
        }
        catch { }

        // Sauvegarder le refresh token
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryDate = DateTime.UtcNow.AddDays(
            int.Parse(_configuration["Jwt:RefreshTokenExpirationDays"] ?? "7"));
        user.LastLogin = DateTime.UtcNow;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        // Log de connexion réussie
        await _auditLogRepository.LogActionAsync(
            user.Id, "LOGIN_SUCCESS", "User", user.Id.ToString(), null, null, ipAddress, userAgent);

        return new LoginResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            ExpiresIn = int.Parse(_configuration["Jwt:ExpirationMinutes"] ?? "60") * 60,
            User = _mapper.Map<UserDto>(user)
        };
    }

    public async Task<RefreshTokenResponseDto?> RefreshTokenAsync(string refreshToken)
    {
        var user = await _userRepository.GetByRefreshTokenAsync(refreshToken);

        if (user == null || 
            user.RefreshTokenExpiryDate == null || 
            user.RefreshTokenExpiryDate < DateTime.UtcNow)
        {
            return null;
        }

        // Générer un nouveau JWT token
        var newToken = GenerateJwtToken(user);
        var expirationMinutes = int.Parse(_configuration["Jwt:ExpirationMinutes"] ?? "30");

        return new RefreshTokenResponseDto
        {
            Token = newToken,
            RefreshToken = user.RefreshToken ?? "",
            ExpiresIn = DateTime.UtcNow.AddMinutes(expirationMinutes)
        };
    }

    public async Task LogoutAsync(Guid userId, string refreshToken)
    {
        var user = await _userRepository.GetByIdAsync(userId);

        if (user != null && user.RefreshToken == refreshToken)
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiryDate = null;

            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();

            await _auditLogRepository.LogActionAsync(
                userId, "LOGOUT", "User", userId.ToString(), null, null);
        }
    }

    public async Task<bool> ChangePasswordAsync(Guid userId, string oldPassword, string newPassword)
    {
        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
        {
            return false;
        }

        // Vérifier l'ancien mot de passe
        if (!VerifyPassword(oldPassword, user.PasswordHash))
        {
            return false;
        }

        // Valider le nouveau mot de passe
        ValidatePassword(newPassword);

        // Hasher et sauvegarder le nouveau mot de passe
        user.PasswordHash = HashPassword(newPassword);
        user.LastPasswordChange = DateTime.UtcNow;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        // Log
        await _auditLogRepository.LogActionAsync(
            userId, "PASSWORD_CHANGED", "User", userId.ToString(), null, null);

        return true;
    }

    public async Task<UserDto?> GetUserByIdAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        return user == null ? null : _mapper.Map<UserDto>(user);
    }

    public async Task ForgotPasswordAsync(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email);

        if (user != null && user.IsActive)
        {
            // Générer un token de réinitialisation
            var resetToken = GeneratePasswordResetToken();
            
            user.PasswordResetToken = resetToken;
            user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);

            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();

            // TODO: Envoyer email avec le token
            // await _emailService.SendPasswordResetEmailAsync(user.Email, resetToken);

            await _auditLogRepository.LogActionAsync(
                user.Id, "PASSWORD_RESET_REQUESTED", "User", user.Id.ToString(), null, null);
        }
    }

    public async Task<bool> ResetPasswordAsync(string token, string newPassword)
    {
        var user = await _userRepository.GetByPasswordResetTokenAsync(token);

        if (user == null || 
            user.PasswordResetTokenExpiry == null || 
            user.PasswordResetTokenExpiry < DateTime.UtcNow)
        {
            return false;
        }

        // Valider le nouveau mot de passe
        ValidatePassword(newPassword);

        // Réinitialiser le mot de passe
        user.PasswordHash = HashPassword(newPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        user.LastPasswordChange = DateTime.UtcNow;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        // Log
        await _auditLogRepository.LogActionAsync(
            user.Id, "PASSWORD_RESET_COMPLETED", "User", user.Id.ToString(), null, null);

        return true;
    }

    // Méthodes privées

    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var secretKeyString = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
        var secretKey = Encoding.UTF8.GetBytes(secretKeyString);
        var expirationMinutes = int.Parse(jwtSettings["ExpirationMinutes"] ?? "60");

        var tokenHandler = new JwtSecurityTokenHandler();
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("NomComplet", user.NomComplet),
                new Claim("Matricule", user.Matricule ?? string.Empty)
            }),
            Expires = DateTime.UtcNow.AddMinutes(expirationMinutes),
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"],
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(secretKey),
                SecurityAlgorithms.HmacSha256Signature)
        };

        try
        {
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var written = tokenHandler.WriteToken(token);
            // Debug: write token length to stderr so test logs capture it
            try { Console.Error.WriteLine($"[GenerateJwtToken] token length={written?.Length}"); } catch { }
            return written;
        }
        catch (Exception ex)
        {
            // log to stderr to make sure test runs can surface the error
            try { Console.Error.WriteLine("[GenerateJwtToken] Exception: " + ex); } catch { }
            throw;
        }
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private string GeneratePasswordResetToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber)
            .Replace("+", "")
            .Replace("/", "")
            .Replace("=", "");
    }

    private string HashPassword(string password)
    {
        // Utilisation de BCrypt pour hasher les mots de passe
        return BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);
    }

    private bool VerifyPassword(string password, string passwordHash)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, passwordHash);
        }
        catch
        {
            return false;
        }
    }

    private void ValidatePassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            throw new ArgumentException("Le mot de passe est requis");
        }

        if (password.Length < 12)
        {
            throw new ArgumentException("Le mot de passe doit contenir au moins 12 caractères");
        }

        if (!password.Any(char.IsUpper))
        {
            throw new ArgumentException("Le mot de passe doit contenir au moins une majuscule");
        }

        if (!password.Any(char.IsLower))
        {
            throw new ArgumentException("Le mot de passe doit contenir au moins une minuscule");
        }

        if (!password.Any(char.IsDigit))
        {
            throw new ArgumentException("Le mot de passe doit contenir au moins un chiffre");
        }

        if (!password.Any(ch => !char.IsLetterOrDigit(ch)))
        {
            throw new ArgumentException("Le mot de passe doit contenir au moins un caractère spécial");
        }
    }
}