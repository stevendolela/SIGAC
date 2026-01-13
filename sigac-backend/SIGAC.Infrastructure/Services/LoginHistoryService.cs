using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using SIGAC.Infrastructure.Data;

namespace SIGAC.Infrastructure.Services;

/// <summary>
/// Service de gestion de l'historique des connexions
/// Extraction des logs d'authentification depuis AuditLog
/// </summary>
public class LoginHistoryService : ILoginHistoryService
{
    private readonly ApplicationDbContext _context;

    public LoginHistoryService(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Récupère l'historique de connexion de l'utilisateur actuel
    /// </summary>
    public async Task<List<LoginHistoryDto>> GetMyLoginHistoryAsync(Guid userId, int limit = 50)
    {
        var history = await _context.AuditLogs
            .Where(a => a.UserId == userId && a.Action == "LOGIN_SUCCESS")
            .OrderByDescending(a => a.Timestamp)
            .Take(limit)
            .Include(a => a.User)
            .Select(a => new LoginHistoryDto
            {
                Id = a.Id,
                Timestamp = a.Timestamp,
                UserId = a.UserId,
                UserName = a.User != null ? a.User.Username : null,
                NomComplet = a.User != null ? a.User.NomComplet : null,
                IpAddress = a.IpAddress,
                UserAgent = a.UserAgent,
                IsSuccessful = true
            })
            .ToListAsync();

        // Parse UserAgent pour extraire device, browser, OS
        foreach (var item in history)
        {
            if (!string.IsNullOrEmpty(item.UserAgent))
            {
                ParseUserAgent(item);
            }
        }

        return history;
    }

    /// <summary>
    /// Récupère l'historique de connexion de tous les utilisateurs (Admin only)
    /// </summary>
    public async Task<List<LoginHistoryDto>> GetAllLoginHistoryAsync(Guid userId, UserRole userRole, int limit = 100)
    {
        // Only Admin can access all login history
        if (userRole != UserRole.Admin)
        {
            throw new UnauthorizedAccessException("Seuls les administrateurs peuvent accéder à l'historique de connexion global");
        }

        var history = await _context.AuditLogs
            .Where(a => a.Action == "LOGIN_SUCCESS")
            .OrderByDescending(a => a.Timestamp)
            .Take(limit)
            .Include(a => a.User)
            .Select(a => new LoginHistoryDto
            {
                Id = a.Id,
                Timestamp = a.Timestamp,
                UserId = a.UserId,
                UserName = a.User != null ? a.User.Username : null,
                NomComplet = a.User != null ? a.User.NomComplet : null,
                IpAddress = a.IpAddress,
                UserAgent = a.UserAgent,
                IsSuccessful = true
            })
            .ToListAsync();

        // Parse UserAgent
        foreach (var item in history)
        {
            if (!string.IsNullOrEmpty(item.UserAgent))
            {
                ParseUserAgent(item);
            }
        }

        return history;
    }

    /// <summary>
    /// Récupère l'historique de connexion pour un utilisateur spécifique (Admin only)
    /// </summary>
    public async Task<List<LoginHistoryDto>> GetUserLoginHistoryAsync(Guid userId, Guid targetUserId, UserRole userRole, int limit = 50)
    {
        // Only Admin can access other user's login history
        if (userRole != UserRole.Admin && userId != targetUserId)
        {
            throw new UnauthorizedAccessException("Vous ne pouvez consulter que votre propre historique de connexion");
        }

        var history = await _context.AuditLogs
            .Where(a => a.UserId == targetUserId && a.Action == "LOGIN_SUCCESS")
            .OrderByDescending(a => a.Timestamp)
            .Take(limit)
            .Include(a => a.User)
            .Select(a => new LoginHistoryDto
            {
                Id = a.Id,
                Timestamp = a.Timestamp,
                UserId = a.UserId,
                UserName = a.User != null ? a.User.Username : null,
                NomComplet = a.User != null ? a.User.NomComplet : null,
                IpAddress = a.IpAddress,
                UserAgent = a.UserAgent,
                IsSuccessful = true
            })
            .ToListAsync();

        // Parse UserAgent
        foreach (var item in history)
        {
            if (!string.IsNullOrEmpty(item.UserAgent))
            {
                ParseUserAgent(item);
            }
        }

        return history;
    }

    /// <summary>
    /// Parse le UserAgent pour extraire le browser, OS et device
    /// </summary>
    private void ParseUserAgent(LoginHistoryDto history)
    {
        if (string.IsNullOrEmpty(history.UserAgent))
            return;

        var ua = history.UserAgent;

        // Détecte le navigateur
        if (ua.Contains("Chrome") && !ua.Contains("Chromium"))
            history.Browser = "Chrome";
        else if (ua.Contains("Safari") && !ua.Contains("Chrome"))
            history.Browser = "Safari";
        else if (ua.Contains("Firefox"))
            history.Browser = "Firefox";
        else if (ua.Contains("Edge"))
            history.Browser = "Edge";
        else if (ua.Contains("MSIE") || ua.Contains("Trident"))
            history.Browser = "Internet Explorer";
        else
            history.Browser = "Autre";

        // Détecte l'OS
        if (ua.Contains("Windows"))
            history.OS = "Windows";
        else if (ua.Contains("Mac"))
            history.OS = "macOS";
        else if (ua.Contains("Linux"))
            history.OS = "Linux";
        else if (ua.Contains("iPhone"))
            history.OS = "iOS";
        else if (ua.Contains("Android"))
            history.OS = "Android";
        else
            history.OS = "Autre";

        // Détecte le device
        if (ua.Contains("Mobile") || ua.Contains("iPhone") || ua.Contains("Android"))
            history.Device = "Mobile";
        else if (ua.Contains("Tablet") || ua.Contains("iPad"))
            history.Device = "Tablet";
        else
            history.Device = "Desktop";
    }
}
