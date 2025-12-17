using AspNetCoreRateLimit;

namespace SIGAC.API.Configuration
{
    /// <summary>
    /// Configuration du Rate Limiting pour protéger contre les attaques brute-force et DDoS
    /// </summary>
    public static class RateLimitingConfiguration
    {
        public static IServiceCollection AddRateLimiting(this IServiceCollection services, IConfiguration configuration)
        {
            // Configuration depuis appsettings.json ou variables d'environnement
            services.Configure<IpRateLimitOptions>(options =>
            {
                // Limite globale: 100 requêtes par minute par IP
                options.GeneralRules = new List<RateLimitRule>
                {
                    new RateLimitRule
                    {
                        Endpoint = "*",
                        Limit = 100,
                        Period = "1m"
                    },
                    // Protection login: 5 tentatives par minute
                    new RateLimitRule
                    {
                        Endpoint = "POST:/api/auth/login",
                        Limit = 5,
                        Period = "1m"
                    },
                    // Protection register: 3 créations par heure
                    new RateLimitRule
                    {
                        Endpoint = "POST:/api/auth/register",
                        Limit = 3,
                        Period = "1h"
                    },
                    // Protection password reset: 3 demandes par heure
                    new RateLimitRule
                    {
                        Endpoint = "POST:/api/auth/forgot-password",
                        Limit = 3,
                        Period = "1h"
                    },
                    // Protection upload fichiers: 10 par minute
                    new RateLimitRule
                    {
                        Endpoint = "POST:/api/documents/*",
                        Limit = 10,
                        Period = "1m"
                    }
                };

                // Whitelist (IPs exemptées de rate limiting)
                options.IpWhitelist = new List<string>
                {
                    "127.0.0.1", // Localhost
                    "::1"        // Localhost IPv6
                };

                // Message d'erreur personnalisé
                options.QuotaExceededResponse = new QuotaExceededResponse
                {
                    Content = "{{\"success\":false,\"message\":\"Trop de requêtes. Veuillez réessayer dans {0} secondes.\"}}",
                    ContentType = "application/json",
                    StatusCode = 429
                };

                options.EnableEndpointRateLimiting = true;
                options.StackBlockedRequests = false;
                options.RealIpHeader = "X-Real-IP";
                options.ClientIdHeader = "X-ClientId";
                options.HttpStatusCode = 429;
            });

            // Politique de rate limiting basée sur le client
            services.Configure<IpRateLimitPolicies>(options =>
            {
                options.IpRules = new List<IpRateLimitPolicy>();
            });

            // Injection des dépendances
            services.AddMemoryCache();
            services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
            services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
            services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
            services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();

            return services;
        }
    }
}
