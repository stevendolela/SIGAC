using Microsoft.AspNetCore.Mvc;
using SIGAC.Infrastructure.Data;

namespace SIGAC.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<HealthController> _logger;

    public HealthController(ApplicationDbContext dbContext, ILogger<HealthController> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// Vérification de santé de l'API et de ses dépendances
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<HealthCheckResponse>> GetHealth()
    {
        try
        {
            var dbHealthy = await CheckDatabaseHealth();
            
            var response = new HealthCheckResponse
            {
                Status = dbHealthy ? "Healthy" : "Degraded",
                Timestamp = DateTime.UtcNow,
                Version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "unknown",
                Services = new HealthCheckServices
                {
                    Database = dbHealthy ? "Connected" : "Unreachable"
                }
            };

            var statusCode = dbHealthy ? StatusCodes.Status200OK : StatusCodes.Status503ServiceUnavailable;
            return StatusCode(statusCode, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed");
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new HealthCheckResponse
            {
                Status = "Unhealthy",
                Timestamp = DateTime.UtcNow,
                Version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "unknown",
                Services = new HealthCheckServices { Database = "Error" }
            });
        }
    }

    private async Task<bool> CheckDatabaseHealth()
    {
        try
        {
            // Attempt a simple query to verify database connection
            var canConnect = await _dbContext.Database.CanConnectAsync();
            return canConnect;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Database health check failed");
            return false;
        }
    }
}

public class HealthCheckResponse
{
    public required string Status { get; set; }
    public DateTime Timestamp { get; set; }
    public required string Version { get; set; }
    public required HealthCheckServices Services { get; set; }
}

public class HealthCheckServices
{
    public required string Database { get; set; }
}
