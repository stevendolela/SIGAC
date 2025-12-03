using SIGAC.Core.Entities;
using SIGAC.Core.DTOs;
using SIGAC.Core.Interfaces;
using SIGAC.Core.Enums;
using SIGAC.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace SIGAC.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        return await _context.Users.FindAsync(id);
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<User?> GetByRefreshTokenAsync(string refreshToken)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken && u.RefreshTokenExpiryDate > DateTime.UtcNow);
    }

    public async Task<User?> GetByPasswordResetTokenAsync(string token)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.PasswordResetToken == token && u.PasswordResetTokenExpiry > DateTime.UtcNow);
    }

    public async Task<(List<User> Items, PaginationMetadata Pagination)> GetUsersAsync(
        int page = 1, int pageSize = 10, string? search = null)
    {
        var query = _context.Users.AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(u => u.Username.Contains(search) || u.Email.Contains(search));
        }

        var totalItems = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var users = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .OrderBy(u => u.Username)
            .ToListAsync();

        var pagination = new PaginationMetadata
        {
            CurrentPage = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages
        };

        return (users, pagination);
    }

    public async Task AddAsync(User user)
    {
        _context.Users.Add(user);
    }

    public void Update(User user)
    {
        _context.Users.Update(user);
    }

    public void Delete(User user)
    {
        _context.Users.Remove(user);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    public async Task<List<User>> GetByRoleAsync(UserRole role)
    {
        return await _context.Users
            .Where(u => u.Role == role && u.IsActive)
            .OrderBy(u => u.NomComplet)
            .ToListAsync();
    }
}
