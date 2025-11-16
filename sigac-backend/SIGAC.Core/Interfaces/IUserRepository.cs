namespace SIGAC.Core.Interfaces;

using SIGAC.Core.Entities;
using SIGAC.Core.DTOs;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByRefreshTokenAsync(string refreshToken);
    Task<User?> GetByPasswordResetTokenAsync(string token);
    Task<(List<User> Items, PaginationMetadata Pagination)> GetUsersAsync(int page = 1, int pageSize = 10, string? search = null);
    Task AddAsync(User user);
    void Update(User user);
    void Delete(User user);
    Task SaveChangesAsync();
}
