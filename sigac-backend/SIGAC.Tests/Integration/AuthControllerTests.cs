using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;
using SIGAC.API;
using SIGAC.Core.DTOs;
using SIGAC.Infrastructure.Data;

namespace SIGAC.Tests.Integration;

[TestFixture]
public class AuthControllerTests
{
    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _client = null!;

    [OneTimeSetUp]
    public void OneTimeSetUp()
    {
        // Configure a test factory with in-memory database
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove the existing DbContext registration
                    var dbContextDescriptor = services.SingleOrDefault(d => 
                        d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                    if (dbContextDescriptor != null)
                    {
                        services.Remove(dbContextDescriptor);
                    }

                    // Add in-memory database for testing
                    services.AddDbContext<ApplicationDbContext>(options =>
                    {
                        options.UseInMemoryDatabase("TestDb");
                    });
                });
            });

        _client = _factory.CreateClient();

        // Initialize database seeding after factory creation
        InitializeDatabaseAsync().Wait();
    }

    private async Task InitializeDatabaseAsync()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            context.Database.EnsureCreated();
            await DbInitializer.Initialize(context);
        }
    }

    [OneTimeTearDown]
    public void OneTimeTearDown()
    {
        _client?.Dispose();
        _factory?.Dispose();
    }

    [Test]
    public async Task Login_WithValidCredentials_ReturnsOkWithToken()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Username = "admin",
            Password = "Admin@2024!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/Auth/login", loginDto);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK), 
            "Expected 200 OK response for valid credentials");
        
        var jsonContent = await response.Content.ReadAsStringAsync();
    // Debug: print raw response body to stderr for diagnosis
    Console.Error.WriteLine("[TEST DEBUG] Login response body: " + jsonContent);
        Assert.That(jsonContent, Is.Not.Null.And.Not.Empty, "Response body should not be empty");

        var loginResponse = JsonSerializer.Deserialize<LoginResponseDto>(jsonContent, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
        Assert.That(loginResponse, Is.Not.Null, "LoginResponseDto should be deserialized");
        Assert.That(loginResponse!.Token, Is.Not.Null.And.Not.Empty, "JWT token should be present");
        Assert.That(loginResponse.RefreshToken, Is.Not.Null.And.Not.Empty, "Refresh token should be present");
        Assert.That(loginResponse.ExpiresIn, Is.GreaterThan(0), "Token expiration should be positive");
        Assert.That(loginResponse.User, Is.Not.Null, "User data should be present");
        Assert.That(loginResponse.User!.Username, Is.EqualTo("admin"), "Username should match");
    }

    [Test]
    public async Task Login_WithInvalidPassword_ReturnsUnauthorized()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Username = "admin",
            Password = "WrongPassword123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/Auth/login", loginDto);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized), 
            "Expected 401 Unauthorized for wrong password");
    }

    [Test]
    public async Task Login_WithNonexistentUser_ReturnsUnauthorized()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Username = "nonexistent",
            Password = "AnyPassword123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/Auth/login", loginDto);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized), 
            "Expected 401 Unauthorized for nonexistent user");
    }

    [Test]
    public async Task Login_WithEmptyUsername_ReturnsBadRequest()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Username = "",
            Password = "Admin@2024!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/Auth/login", loginDto);

        // Assert
        // Model validation should catch this and return 400
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest), 
            "Expected 400 Bad Request for empty username");
    }

    [Test]
    public async Task Login_TokenIsValidJwt()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Username = "admin",
            Password = "Admin@2024!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/Auth/login", loginDto);
        var jsonContent = await response.Content.ReadAsStringAsync();
    Console.Error.WriteLine("[TEST DEBUG] Login response body: " + jsonContent);
        var loginResponse = JsonSerializer.Deserialize<LoginResponseDto>(jsonContent, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        // Assert
        Assert.That(loginResponse, Is.Not.Null, "Response should be deserialized");
        var token = loginResponse!.Token;

        // JWT format: header.payload.signature (3 parts separated by dots)
        var parts = token.Split('.');
        Assert.That(parts, Has.Length.EqualTo(3), "JWT should have 3 parts (header.payload.signature)");

        // Try to decode payload (it's base64url encoded)
        try
        {
            var payload = parts[1];
            // Add padding if necessary
            var padding = 4 - (payload.Length % 4);
            if (padding != 4) payload += new string('=', padding);
            
            var payloadBytes = Convert.FromBase64String(payload);
            var payloadJson = System.Text.Encoding.UTF8.GetString(payloadBytes);
            
            var payloadObj = JsonDocument.Parse(payloadJson);
            var root = payloadObj.RootElement;
            
            // Check standard JWT claims
            Assert.That(root.TryGetProperty("nameid", out _), Is.True, "JWT should contain 'nameid' claim");
            Assert.That(root.TryGetProperty("unique_name", out _), Is.True, "JWT should contain 'unique_name' claim");
            Assert.That(root.TryGetProperty("email", out _), Is.True, "JWT should contain 'email' claim");
            Assert.That(root.TryGetProperty("role", out _), Is.True, "JWT should contain 'role' claim");
        }
        catch (Exception ex)
        {
            Assert.Fail($"Failed to decode JWT: {ex.Message}");
        }
    }
}
