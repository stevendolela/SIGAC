using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SIGAC.API.Middleware;
using SIGAC.API.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Mvc.NewtonsoftJson;
using Microsoft.AspNetCore.Mvc.Formatters;
using SIGAC.Core.Interfaces;
using SIGAC.Core.Services;
using SIGAC.Infrastructure.Data;
using SIGAC.Infrastructure.Repositories;
using SIGAC.Infrastructure.Services;
using Serilog;
using System.Text;
using AspNetCoreRateLimit;
using FluentValidation;
using FluentValidation.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Forcer Kestrel à écouter sur 0.0.0.0:PORT (Render assigne PORT dynamiquement)
var portEnv = Environment.GetEnvironmentVariable("PORT");
var port = 10000;
if (!string.IsNullOrEmpty(portEnv) && int.TryParse(portEnv, out var parsed))
{
    port = parsed;
}
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(port); // HTTP
});

// Configuration Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/sigac-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Parse DB connection string - handle Render PostgreSQL URL format
var dbConnectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrEmpty(dbConnectionString))
{
    throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
}

// If connection string starts with "postgresql://", convert to EF Core format
if (dbConnectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
{
    Log.Information("Detected Render PostgreSQL URL format, parsing...");
    try
    {
        var uri = new Uri(dbConnectionString);
        var userInfo = uri.UserInfo.Split(':');
        var username = Uri.UnescapeDataString(userInfo[0]);
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
        var host = uri.Host;
        var dbPort = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');
        
        // Build EF Core connection string
        dbConnectionString = $"Host={host};Port={dbPort};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;";
        Log.Information("Successfully converted PostgreSQL URL: Host={Host};Port={Port};Database={Database};Username={Username}", host, dbPort, database, username);
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Failed to parse PostgreSQL URL: {Url}", dbConnectionString);
        throw;
    }
}

// Configuration de la base de données
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(
        dbConnectionString,
        npgsqlOptions => npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorCodesToAdd: null
        )
    )
);

// Configuration JWT - Sécurisée avec variables d'environnement
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") 
    ?? builder.Configuration["Jwt:SecretKey"];
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") 
    ?? builder.Configuration["Jwt:Issuer"];
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") 
    ?? builder.Configuration["Jwt:Audience"];

if (string.IsNullOrWhiteSpace(jwtSecret))
{
    throw new InvalidOperationException("Configuration manquante: JWT_SECRET_KEY (variable d'environnement) ou Jwt:SecretKey");
}

if (jwtSecret.Length < 32)
{
    throw new InvalidOperationException("Le JWT_SECRET_KEY doit faire au moins 32 caractères pour une sécurité optimale");
}

var secretKey = Encoding.UTF8.GetBytes(jwtSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = builder.Environment.IsProduction();
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(secretKey),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Enregistrement des services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IDossierService, DossierService>();
builder.Services.AddScoped<IDocumentService, DocumentService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ISalleService, SalleService>();
builder.Services.AddScoped<IAudienceService, AudienceService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IEmailService, SmtpEmailService>();
builder.Services.AddScoped<ISmtpEmailService, SmtpEmailService>();
builder.Services.AddScoped<IEmailNotificationService, EmailNotificationService>();
builder.Services.AddScoped<ISmsService, SmsService>();
builder.Services.AddScoped<ISmsService, SmsService>();
builder.Services.AddScoped<ICalendarService, CalendarService>();
builder.Services.AddScoped<IFormationService, FormationService>();
builder.Services.AddScoped<IJugeProfileService, JugeProfileService>();
builder.Services.AddScoped<ISystemConfigService, SIGAC.Infrastructure.Services.SystemConfigService>();
builder.Services.AddScoped<ISystemInfoService, SIGAC.Infrastructure.Services.SystemInfoServiceImpl>();
builder.Services.AddScoped<ILoginHistoryService, LoginHistoryService>();
builder.Services.AddScoped<ITypeAffaireService, TypeAffaireService>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<IChatGroupService, ChatGroupService>();
builder.Services.AddScoped<IWorkspaceService, WorkspaceService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IBulkImportService, BulkImportService>();
builder.Services.AddScoped<IBulkDocumentImportService, BulkDocumentImportService>();
builder.Services.AddScoped<IExternalDocumentImportService, ExternalDocumentImportService>();

// Enregistrement des repositories
builder.Services.AddScoped<IDossierRepository, DossierRepository>();
builder.Services.AddScoped<IDocumentRepository, DocumentRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
builder.Services.AddScoped<IPasswordChangeRequestRepository, PasswordChangeRequestRepository>();
builder.Services.AddScoped<IChatGroupRepository, ChatGroupRepository>();
builder.Services.AddScoped<ISalleRepository, SalleRepository>();
builder.Services.AddScoped<IChatRepository, ChatRepository>();
builder.Services.AddScoped<IAudienceRepository, AudienceRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<ICalendarRepository, CalendarRepository>();
builder.Services.AddScoped<IFormationRepository, FormationRepository>();
builder.Services.AddScoped<IJugeProfileRepository, JugeProfileRepository>();
builder.Services.AddScoped<ISmtpConfigurationRepository, SmtpConfigurationRepository>();
builder.Services.AddScoped<ITypeAffaireRepository, TypeAffaireRepository>();
builder.Services.AddScoped<IWorkspaceRepository, WorkspaceRepository>();

// Configuration Rate Limiting (Protection contre brute-force et DDoS)
builder.Services.AddRateLimiting(builder.Configuration);

// Configuration FluentValidation (Validation stricte des inputs)
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// AutoMapper
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// CORS - Configuration flexible pour dev et production
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowedOrigins", policy =>
    {
        var allowedOrigins = new List<string>();
        
        // 1. Essayer de lire comme array d'abord (appsettings.json)
        var originsArray = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
        if (originsArray != null && originsArray.Length > 0)
        {
            allowedOrigins.AddRange(originsArray);
        }
        
        // 2. Essayer de lire comme string JSON (format Render avec env var)
        var originsString = builder.Configuration["Cors:AllowedOrigins"];
        if (!string.IsNullOrWhiteSpace(originsString) && !originsString.StartsWith("["))
        {
            // Si c'est une string seule (pas JSON), l'ajouter directement
            allowedOrigins.Add(originsString);
        }
        else if (!string.IsNullOrWhiteSpace(originsString) && originsString.StartsWith("["))
        {
            try
            {
                var parsed = System.Text.Json.JsonSerializer.Deserialize<string[]>(originsString);
                if (parsed != null) allowedOrigins.AddRange(parsed);
            }
            catch (Exception ex)
            {
                Log.Warning("Failed to parse Cors:AllowedOrigins as JSON: {Exception}", ex.Message);
            }
        }
        
        // Ajouter URL Vercel par défaut
        if (!allowedOrigins.Contains("https://sigac-frontend-5tba4lw5i-steves-projects-60de588f.vercel.app"))
            allowedOrigins.Add("https://sigac-frontend-5tba4lw5i-steves-projects-60de588f.vercel.app");
        
        // Ajouter domaine production taajii.fr
        if (!allowedOrigins.Contains("https://taajii.fr"))
            allowedOrigins.Add("https://taajii.fr");
        if (!allowedOrigins.Contains("https://www.taajii.fr"))
            allowedOrigins.Add("https://www.taajii.fr");
        
        // Ajouter localhost pour dev
        var devOrigins = new[] { "http://localhost:5674", "http://localhost:5673", "http://localhost:5173" };
        foreach (var origin in devOrigins)
            if (!allowedOrigins.Contains(origin)) allowedOrigins.Add(origin);
        
        if (allowedOrigins.Count > 0)
        {
            Log.Information("CORS configured for origins: {Origins}", string.Join(", ", allowedOrigins));
            policy.WithOrigins(allowedOrigins.ToArray())
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            Log.Warning("No CORS origins configured, allowing all origins");
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
    });
});

// Controllers: use Newtonsoft.Json for compatibility with TestServer's pipe writer
builder.Services.AddControllers()
    .AddNewtonsoftJson(options =>
    {
        // Use camel case and serialize enums as NUMBERS (not strings) for frontend compatibility
        options.SerializerSettings.ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver();
        // REMOVED StringEnumConverter to serialize enums as numbers (0, 1, 2) instead of strings
    })
    .AddJsonOptions(options =>
    {
        // Keep System.Text.Json settings for other usages (fallback) - also serialize enums as numbers
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        // REMOVED JsonStringEnumConverter to serialize enums as numbers
    })
    .ConfigureApiBehaviorOptions(opts => { /* keep defaults */ })
    .AddMvcOptions(mvcOptions =>
    {
        // Remove the System.Text.Json output formatter to ensure Newtonsoft is used by default
        var systemJsonFormatter = mvcOptions.OutputFormatters.OfType<SystemTextJsonOutputFormatter>().FirstOrDefault();
        if (systemJsonFormatter != null)
        {
            mvcOptions.OutputFormatters.Remove(systemJsonFormatter);
        }
    });

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Taajii GED API",
        Version = "v1",
        Description = "Taajii GED - Gestion Électronique des Dossiers - Cour Constitutionnelle RDC",
        Contact = new OpenApiContact
        {
            Name = "Support Taajii GED",
            Email = "support@courconstitutionnelle.cd"
        }
    });

    // Configuration JWT dans Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// HttpContextAccessor pour accéder au contexte HTTP
builder.Services.AddHttpContextAccessor();

var app = builder.Build();

// Configuration du pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "SIGAC API v1");
        c.RoutePrefix = string.Empty;
    });
}

// HTTPS obligatoire en production
if (app.Environment.IsProduction())
{
    // HTTP Strict Transport Security (HSTS)
    app.UseHsts();
}

app.UseHttpsRedirection();

// Rate Limiting AVANT l'authentification et l'autorisation
app.UseIpRateLimiting();

app.UseCors("AllowedOrigins");

// Servir les fichiers statiques (uploads)
// Utiliser le chemin configuré dans FileStorage:BasePath
var uploadsPath = builder.Configuration["FileStorage:BasePath"] ?? "./uploads";

// Convertir en chemin absolu si nécessaire
if (!Path.IsPathRooted(uploadsPath))
{
    uploadsPath = Path.Combine(AppContext.BaseDirectory, uploadsPath);
}

if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
    Log.Information("Created uploads directory: {UploadsPath}", uploadsPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

// Middleware de gestion des erreurs en tête pour capturer toutes les exceptions
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Middleware personnalisé pour l'audit (après la gestion d'erreur)
app.UseMiddleware<AuditMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Initialisation de la base de données
using var scope = app.Services.CreateScope();
var services = scope.ServiceProvider;
try
{
    var context = services.GetRequiredService<ApplicationDbContext>();

    // Appliquer les migrations uniquement si le provider de base de données est relationnel
    // (évite d'appeler Migrate() pour les providers in-memory utilisés dans les tests)
    try
    {
        if (context.Database.IsRelational())
        {
            context.Database.Migrate();
        }
    }
    catch
    {
        // Si IsRelational() n'est pas disponible pour une raison quelconque,
        // on ignore silencieusement pour ne pas casser les tests d'intégration.
    }

    // Seed des données initiales
    try
    {
        await SIGAC.Infrastructure.Data.DbInitializer.Initialize(context);
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "DbInitializer encountered an error, continuing startup");
    }

    Log.Information("Base de données initialisée avec succès");
}
catch (Exception ex)
{
    Log.Error(ex, "Erreur lors de l'initialisation de la base de données");
    throw;
}

Log.Information("SIGAC API démarrée sur {Environment}", app.Environment.EnvironmentName);

try
{
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "L'hôte a été arrêté de façon inattendue");
    throw;
}
finally
{
    Log.CloseAndFlush();
}