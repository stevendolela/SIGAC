using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using SIGAC.Core.Interfaces;
using System.Net;
using System.Security.Claims;
using System.Text.Json;

namespace SIGAC.API.Middleware;

/// <summary>
/// Middleware de gestion globale des exceptions
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var requestId = Guid.NewGuid().ToString();
        
        _logger.LogError(exception, 
            "Exception non gérée pour la requête {RequestId} - {Method} {Path} | Type={ExceptionType} | Message={Message}", 
            requestId, 
            context.Request.Method, 
            context.Request.Path,
            exception.GetType().Name,
            exception.Message);

        context.Response.ContentType = "application/json";

        // Build response with detailed error info for debugging
        var response = exception switch
        {
            UnauthorizedAccessException => new ErrorResponse
            {
                Error = "Forbidden",
                Message = exception.Message,
                RequestId = requestId,
                StatusCode = (int)HttpStatusCode.Forbidden,
                ExceptionType = exception.GetType().Name,
                StackTrace = exception.StackTrace
            },
            ArgumentException => new ErrorResponse
            {
                Error = "ValidationError",
                Message = exception.Message,
                RequestId = requestId,
                StatusCode = (int)HttpStatusCode.BadRequest,
                ExceptionType = exception.GetType().Name,
                StackTrace = exception.StackTrace
            },
            KeyNotFoundException => new ErrorResponse
            {
                Error = "NotFound",
                Message = exception.Message,
                RequestId = requestId,
                StatusCode = (int)HttpStatusCode.NotFound,
                ExceptionType = exception.GetType().Name,
                StackTrace = exception.StackTrace
            },
            _ => new ErrorResponse
            {
                Error = "InternalServerError",
                Message = "Une erreur interne est survenue. Veuillez contacter l'administrateur.",
                RequestId = requestId,
                StatusCode = (int)HttpStatusCode.InternalServerError,
                ExceptionType = exception.GetType().Name,
                Details = exception.Message,
                StackTrace = exception.StackTrace
            }
        };

        context.Response.StatusCode = response.StatusCode;

        var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(jsonResponse);
    }

    private class ErrorResponse
    {
        public string Error { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string RequestId { get; set; } = string.Empty;
        public int StatusCode { get; set; }
        public string? ExceptionType { get; set; }
        public string? Details { get; set; }
        public string? StackTrace { get; set; }
    }
}

/// <summary>
/// Middleware d'audit pour tracer toutes les requêtes API
/// </summary>
public class AuditMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AuditMiddleware> _logger;

    public AuditMiddleware(RequestDelegate next, ILogger<AuditMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IAuditLogRepository auditLogRepository)
    {
        var requestId = Guid.NewGuid().ToString();
        context.Items["RequestId"] = requestId;

        var startTime = DateTime.UtcNow;
        var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        var userAgent = context.Request.Headers["User-Agent"].ToString();
        var method = context.Request.Method;
        var path = context.Request.Path;

        // Récupérer l'utilisateur connecté
        Guid? userId = null;
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdClaim, out var parsedUserId))
            {
                userId = parsedUserId;
            }
        }

        // Log de début de requête
        _logger.LogInformation(
            "Requête {RequestId} démarrée: {Method} {Path} - User: {UserId} - IP: {IpAddress}",
            requestId, method, path, userId?.ToString() ?? "Anonymous", ipAddress);

        try
        {
            await _next(context);

            var duration = DateTime.UtcNow - startTime;
            var statusCode = context.Response.StatusCode;

            // Log de fin de requête
            _logger.LogInformation(
                "Requête {RequestId} terminée: {Method} {Path} - Status: {StatusCode} - Duration: {Duration}ms",
                requestId, method, path, statusCode, duration.TotalMilliseconds);

            // Enregistrer dans la table d'audit pour les opérations importantes
            if (ShouldAudit(method, path, statusCode))
            {
                try
                {
                    await auditLogRepository.LogActionAsync(
                        userId,
                        $"{method} {path}",
                        "API_REQUEST",
                        null,
                        null,
                        $"Status: {statusCode}, Duration: {duration.TotalMilliseconds}ms",
                        ipAddress,
                        userAgent
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erreur lors de l'enregistrement de l'audit pour la requête {RequestId}", requestId);
                }
            }
        }
        catch (Exception ex)
        {
            var duration = DateTime.UtcNow - startTime;

            _logger.LogError(ex,
                "Requête {RequestId} en erreur: {Method} {Path} - Duration: {Duration}ms",
                requestId, method, path, duration.TotalMilliseconds);

            // Enregistrer l'erreur dans l'audit
            try
            {
                await auditLogRepository.LogActionAsync(
                    userId,
                    $"{method} {path}",
                    "API_REQUEST_ERROR",
                    null,
                    null,
                    $"Error: {ex.Message}, Duration: {duration.TotalMilliseconds}ms",
                    ipAddress,
                    userAgent
                );
            }
            catch (Exception auditEx)
            {
                _logger.LogError(auditEx, "Erreur lors de l'enregistrement de l'erreur d'audit");
            }

            throw;
        }
    }

    private bool ShouldAudit(string method, string path, int statusCode)
    {
        // Ne pas auditer les requêtes GET en succès (trop de volume)
        if (method == "GET" && statusCode >= 200 && statusCode < 300)
        {
            return false;
        }

        // Ne pas auditer les requêtes sur /health, /swagger, etc.
        if (path.StartsWith("/health") || 
            path.StartsWith("/swagger") ||
            path.StartsWith("/favicon.ico"))
        {
            return false;
        }

        // Auditer toutes les autres opérations (POST, PUT, DELETE)
        return true;
    }
}