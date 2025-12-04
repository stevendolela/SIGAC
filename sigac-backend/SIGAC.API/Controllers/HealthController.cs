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
            // Try to check database, but don't fail health check if DB is unreachable
            // (especially important during startup on Render)
            bool dbHealthy = false;
            string dbStatus = "Checking...";
            
            try
            {
                dbHealthy = await CheckDatabaseHealth();
                dbStatus = dbHealthy ? "Connected" : "Unreachable";
            }
            catch (Exception dbEx)
            {
                _logger.LogWarning(dbEx, "Database health check error (non-critical for health endpoint)");
                dbStatus = "Error";
                // Don't fail the health check for DB issues - allow service to be healthy even if DB is initializing
                dbHealthy = false;
            }
            
            var response = new HealthCheckResponse
            {
                Status = "Healthy", // Always return Healthy for basic health check
                Timestamp = DateTime.UtcNow,
                Version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "unknown",
                Services = new HealthCheckServices
                {
                    Database = dbStatus
                }
            };

            // Always return 200 OK for basic liveness check (Render expects this)
            return StatusCode(StatusCodes.Status200OK, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed");
            return StatusCode(StatusCodes.Status200OK, new HealthCheckResponse
            {
                Status = "Healthy",
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
