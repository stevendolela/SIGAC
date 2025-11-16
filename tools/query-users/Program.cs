using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SIGAC.Infrastructure.Data;
using System;

var builder = Host.CreateDefaultBuilder()
    .ConfigureAppConfiguration((hostingContext, config) =>
    {
    // Charger la configuration de l'API pour récupérer la connexion
    config.AddJsonFile("/Users/steve/Projects/SIGAC/sigac-backend/SIGAC.API/appsettings.json", optional: false, reloadOnChange: false);
    })
    .ConfigureServices((context, services) =>
    {
        var conn = context.Configuration.GetConnectionString("DefaultConnection");
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(conn)
        );
    })
    .UseConsoleLifetime();

using var host = builder.Build();
using var scope = host.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

Console.WriteLine("Listing users from database:\n");

var users = await db.Users
    .AsNoTracking()
    .Select(u => new { u.Id, u.Username, u.Email, Role = u.Role.ToString(), u.IsActive, u.CreatedAt })
    .ToListAsync();

if (!users.Any())
{
    Console.WriteLine("No users found.");
}
else
{
    foreach (var u in users)
    {
        Console.WriteLine($"Id: {u.Id}");
        Console.WriteLine($"Username: {u.Username}");
        Console.WriteLine($"Email: {u.Email}");
        Console.WriteLine($"Role: {u.Role}");
        Console.WriteLine($"IsActive: {u.IsActive}");
        Console.WriteLine($"CreatedAt: {u.CreatedAt}");
        Console.WriteLine(new string('-', 40));
    }
}

return 0;