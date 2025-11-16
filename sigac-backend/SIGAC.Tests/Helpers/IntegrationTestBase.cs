using System.Net.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SIGAC.API;
using SIGAC.Infrastructure.Data;

namespace SIGAC.Tests.Helpers;

/// <summary>
/// Base d'intégration pour les tests : crée une WebApplicationFactory avec
/// une base en mémoire et fournit un HttpClient prêt à l'emploi.
/// </summary>
public abstract class IntegrationTestBase
{
	protected WebApplicationFactory<Program> Factory = null!;
	protected HttpClient Client = null!;

	public virtual async Task InitializeAsync()
	{
		// Utiliser un nom de base dédiée pour isoler la DB entre runs
		var dbName = "TestDb_" + Guid.NewGuid().ToString("N");

		Factory = new WebApplicationFactory<Program>()
			.WithWebHostBuilder(builder =>
			{
				builder.ConfigureServices(services =>
				{
					// Remplacer le DbContext par une version InMemory
					var descriptor = services.SingleOrDefault(d =>
						d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
					if (descriptor != null)
					{
						services.Remove(descriptor);
					}

					services.AddDbContext<ApplicationDbContext>(options =>
					{
						options.UseInMemoryDatabase(dbName);
					});

					// Construire le provider pour exécuter l'initialisation
					using var sp = services.BuildServiceProvider();
					using var scope = sp.CreateScope();
					var scopedServices = scope.ServiceProvider;
					var context = scopedServices.GetRequiredService<ApplicationDbContext>();
					context.Database.EnsureCreated();
					// Appeler l'initialiseur de test (sync via GetAwaiter)
					SIGAC.Tests.Integration.DbInitializer.Initialize(context).GetAwaiter().GetResult();
				});
			});

		Client = Factory.CreateClient();

		await Task.CompletedTask;
	}

	public virtual async Task DisposeAsync()
	{
		try
		{
			Client?.Dispose();
			Factory?.Dispose();
		}
		catch
		{
			// ignore cleanup errors
		}

		await Task.CompletedTask;
	}
}
