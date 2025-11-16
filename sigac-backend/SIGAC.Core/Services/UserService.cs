using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;

namespace SIGAC.Core.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IMapper _mapper;

    public UserService(
        IUserRepository userRepository,
        IAuditLogRepository auditLogRepository,
        IMapper mapper)
    {
        _userRepository = userRepository;
        _auditLogRepository = auditLogRepository;
        _mapper = mapper;
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

    public async Task<UserDto> CreateUserAsync(string username, string email, string passwordHash, UserRole role, Guid createdBy)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = username,
            Email = email,
            PasswordHash = passwordHash,
            Role = role,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();

        await _auditLogRepository.LogActionAsync(
            createdBy, "CREATE", "User", user.Id.ToString(),
            null, System.Text.Json.JsonSerializer.Serialize(user));

        return _mapper.Map<UserDto>(user);
    }

    public async Task<bool> UpdateUserAsync(Guid userId, string? email, UserRole? role, Guid updatedBy)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            return false;

        var oldValues = System.Text.Json.JsonSerializer.Serialize(user);

        if (!string.IsNullOrEmpty(email))
            user.Email = email;
        
        if (role.HasValue)
            user.Role = role.Value;

        user.ModifiedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        await _auditLogRepository.LogActionAsync(
            updatedBy, "UPDATE", "User", userId.ToString(),
            oldValues, System.Text.Json.JsonSerializer.Serialize(user));

        return true;
    }

    public async Task<bool> DeleteUserAsync(Guid userId, Guid deletedBy)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            return false;

        var oldValues = System.Text.Json.JsonSerializer.Serialize(user);

        _userRepository.Delete(user);
        await _userRepository.SaveChangesAsync();

        await _auditLogRepository.LogActionAsync(
            deletedBy, "DELETE", "User", userId.ToString(),
            oldValues, null);

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

        var oldValues = System.Text.Json.JsonSerializer.Serialize(user);

        // Hash du nouveau password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.ModifiedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        await _auditLogRepository.LogActionAsync(
            changedBy, "CHANGE_PASSWORD", "User", userId.ToString(),
            oldValues, System.Text.Json.JsonSerializer.Serialize(user));

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

        var oldValues = System.Text.Json.JsonSerializer.Serialize(user);

        user.IsActive = false;
        user.ModifiedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        await _auditLogRepository.LogActionAsync(
            deactivatedBy, "DEACTIVATE", "User", userId.ToString(),
            oldValues, System.Text.Json.JsonSerializer.Serialize(user));

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

        var oldValues = System.Text.Json.JsonSerializer.Serialize(user);

        user.IsActive = true;
        user.ModifiedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        await _auditLogRepository.LogActionAsync(
            activatedBy, "ACTIVATE", "User", userId.ToString(),
            oldValues, System.Text.Json.JsonSerializer.Serialize(user));

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
}
