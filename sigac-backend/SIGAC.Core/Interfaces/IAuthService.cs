using SIGAC.Core.DTOs;

namespace SIGAC.Core.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginDto loginDto, string ipAddress, string userAgent);
    Task<RefreshTokenResponseDto?> RefreshTokenAsync(string refreshToken);
    Task LogoutAsync(Guid userId, string refreshToken);
    Task<bool> ChangePasswordAsync(Guid userId, string oldPassword, string newPassword);
    Task<UserDto?> GetUserByIdAsync(Guid userId);
    Task ForgotPasswordAsync(string email);
    Task<bool> ResetPasswordAsync(string token, string newPassword);
}