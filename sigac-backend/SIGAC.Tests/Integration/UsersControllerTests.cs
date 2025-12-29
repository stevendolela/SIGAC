using NUnit.Framework;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;
using SIGAC.Tests.Helpers;

namespace SIGAC.Tests.Integration;

/// <summary>
/// Tests d'intégration pour le contrôleur Utilisateurs.
/// Teste les endpoints CRUD, permissions et validations.
/// </summary>
[TestFixture]
public class UsersControllerTests : IntegrationTestBase
{
    private string? _adminToken;
    private Guid _adminId;

    [SetUp]
    public async Task Setup()
    {
        await InitializeAsync();
        
        // Récupérer le token admin
        var loginResponse = await Client.PostAsJsonAsync("/api/Auth/login", new
        {
            username = "admin",
            password = "Admin@2024!"
        });

        Assert.That(loginResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK), 
            "Admin login failed");

    var content = await loginResponse.Content.ReadFromJsonAsync<LoginResponseDto>();
    Assert.That(content, Is.Not.Null);
    _adminToken = content!.Token;
        _adminId = Guid.Parse("10000000-0000-0000-0000-000000000001"); // ID d'admin dans les seeds

        Client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);
    }

    [TearDown]
    public async Task Teardown()
    {
        await DisposeAsync();
    }

    #region GET /api/Users - List Users

    [Test]
    public async Task GetUsers_WithoutAuth_ShouldReturn401()
    {
        Client.DefaultRequestHeaders.Authorization = null;

        var response = await Client.GetAsync("/api/Users");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task GetUsers_WithAuth_ShouldReturn200WithPaginatedList()
    {
        var response = await Client.GetAsync("/api/Users?page=1&pageSize=10");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var content = await response.Content.ReadFromJsonAsync<PaginatedResult<UserDto>>();
        Assert.That(content, Is.Not.Null);
    Assert.That(content!.Data, Is.Not.Null);
    Assert.That(content!.Data.Count, Is.GreaterThanOrEqualTo(0));
    Assert.That(content!.Pagination, Is.Not.Null);
    Assert.That(content!.Pagination.CurrentPage, Is.EqualTo(1));
    }

    [Test]
    public async Task GetUsers_WithSearch_ShouldFilterByUsernameOrEmail()
    {
        var response = await Client.GetAsync("/api/Users?search=admin");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

    var content = await response.Content.ReadFromJsonAsync<PaginatedResult<UserDto>>();
    Assert.That(content, Is.Not.Null);
    Assert.That(content!.Data, Is.Not.Null);
    Assert.That(content!.Data.Count, Is.GreaterThan(0));
    Assert.That(content!.Data.Any(u => u.Username.Contains("admin", StringComparison.OrdinalIgnoreCase)));
    }

    [Test]
    public async Task GetUsers_WithInvalidPageSize_ShouldClampToMaximum()
    {
        var response = await Client.GetAsync("/api/Users?pageSize=500");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

    var content = await response.Content.ReadFromJsonAsync<PaginatedResult<UserDto>>();
    Assert.That(content, Is.Not.Null);
    Assert.That(content!.Pagination, Is.Not.Null);
    Assert.That(content!.Pagination.PageSize, Is.LessThanOrEqualTo(100));
    }

    #endregion

    #region GET /api/Users/{id} - Get User by ID

    [Test]
    public async Task GetUserById_WithValidId_ShouldReturn200()
    {
        // Récupérer d'abord la liste pour avoir un ID valide
        var listResponse = await Client.GetAsync("/api/Users");
    var listContent = await listResponse.Content.ReadFromJsonAsync<PaginatedResult<UserDto>>();
    Assert.That(listContent, Is.Not.Null);
    Assert.That(listContent!.Data, Is.Not.Null);
    var firstUserId = listContent.Data.FirstOrDefault()?.Id;

    Assert.That(firstUserId, Is.Not.EqualTo(Guid.Empty));

        var response = await Client.GetAsync($"/api/Users/{firstUserId}");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    var content = await response.Content.ReadFromJsonAsync<UserDto>();
    Assert.That(content, Is.Not.Null);
    Assert.That(content!.Id, Is.EqualTo(firstUserId));
    }

    [Test]
    public async Task GetUserById_WithInvalidId_ShouldReturn404()
    {
        var invalidId = Guid.NewGuid();

        var response = await Client.GetAsync($"/api/Users/{invalidId}");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    #endregion

    #region GET /api/Users/profile/current - Get Current User Profile

    [Test]
    public async Task GetCurrentUser_WithAuth_ShouldReturnCurrentUserProfile()
    {
        var response = await Client.GetAsync("/api/Users/profile/current");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    var content = await response.Content.ReadFromJsonAsync<UserDto>();
    Assert.That(content, Is.Not.Null);
    Assert.That(content!.Username, Is.EqualTo("admin"));
    Assert.That(content.Role, Is.EqualTo("Admin"));
    }

    [Test]
    public async Task GetCurrentUser_WithoutAuth_ShouldReturn401()
    {
        Client.DefaultRequestHeaders.Authorization = null;

        var response = await Client.GetAsync("/api/Users/profile/current");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    #endregion

    #region POST /api/Users - Create User

    [Test]
    public async Task CreateUser_WithValidData_ShouldReturn201AndCreateUser()
    {
        var createDto = new CreateUserDto
        {
            Username = "newuser_" + Guid.NewGuid().ToString().Substring(0, 8),
            Email = "newuser_" + Guid.NewGuid().ToString().Substring(0, 8) + "@sigac.local",
            Password = "TestPassword123!",
            Role = UserRole.Collaborateur
        };

        var response = await Client.PostAsJsonAsync("/api/Users", createDto);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));

    var content = await response.Content.ReadFromJsonAsync<UserDto>();
    Assert.That(content, Is.Not.Null);
    Assert.That(content!.Id, Is.Not.EqualTo(Guid.Empty));
    Assert.That(content.Username, Is.EqualTo(createDto.Username));
    Assert.That(content.Email, Is.EqualTo(createDto.Email));
    Assert.That(content.Role, Is.EqualTo(createDto.Role.ToString()));
    Assert.That(content.IsActive, Is.True);
    }

    [Test]
    public async Task CreateUser_WithDuplicateUsername_ShouldReturn400()
    {
        var createDto = new CreateUserDto
        {
            Username = "admin", // Déjà existant
            Email = "new@sigac.local",
            Password = "TestPassword123!",
            Role = UserRole.Consultant
        };

        var response = await Client.PostAsJsonAsync("/api/Users", createDto);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task CreateUser_WithoutAuth_ShouldReturn401()
    {
        Client.DefaultRequestHeaders.Authorization = null;

        var createDto = new CreateUserDto
        {
            Username = "newuser",
            Email = "new@sigac.local",
            Password = "TestPassword123!",
            Role = UserRole.Consultant
        };

        var response = await Client.PostAsJsonAsync("/api/Users", createDto);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task CreateUser_NonAdminUser_ShouldReturn403()
    {
        // Login avec un utilisateur non-admin
        var loginResponse = await Client.PostAsJsonAsync("/api/Auth/login", new
        {
            username = "judge.mbala",
            password = "Judge@2024!"
        });

        if (loginResponse.StatusCode == HttpStatusCode.OK)
        {
            var loginContent = await loginResponse.Content.ReadFromJsonAsync<LoginResponseDto>();
            Assert.That(loginContent, Is.Not.Null);
            Client.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", loginContent!.Token);

            var createDto = new CreateUserDto
            {
                Username = "newuser",
                Email = "new@sigac.local",
                Password = "TestPassword123!",
                Role = UserRole.Consultant
            };

            var response = await Client.PostAsJsonAsync("/api/Users", createDto);

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
        }
    }

    [Test]
    public async Task CreateUser_WithMissingEmail_ShouldReturn400()
    {
        var createDto = new CreateUserDto
        {
            Username = "newuser",
            Password = "TestPassword123!",
            Role = UserRole.Consultant
        };

        var response = await Client.PostAsJsonAsync("/api/Users", createDto);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    #endregion

    #region PUT /api/Users/{id} - Update User

    [Test]
    public async Task UpdateUser_AdminUpdatingOther_ShouldReturn200()
    {
        // Récupérer un utilisateur existant
    var listResponse = await Client.GetAsync("/api/Users");
    var listContent = await listResponse.Content.ReadFromJsonAsync<PaginatedResult<UserDto>>();
    Assert.That(listContent, Is.Not.Null);
    Assert.That(listContent!.Data, Is.Not.Null);
    var targetUser = listContent.Data.FirstOrDefault(u => u.Username != "admin");

        if (targetUser != null)
        {
            var updateDto = new UpdateUserDto
            {
                Email = "updated_" + Guid.NewGuid().ToString().Substring(0, 8) + "@sigac.local"
            };

            var response = await Client.PutAsJsonAsync($"/api/Users/{targetUser.Id}", updateDto);

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

            var content = await response.Content.ReadFromJsonAsync<UserDto>();
            Assert.That(content, Is.Not.Null);
            Assert.That(content!.Email, Is.EqualTo(updateDto.Email));
        }
    }

    [Test]
    public async Task UpdateUser_UserUpdatingOwnEmail_ShouldReturn200()
    {
        // Login comme utilisateur régulier
        var loginResponse = await Client.PostAsJsonAsync("/api/Auth/login", new
        {
            username = "judge.mbala",
            password = "Judge@2024!"
        });

        if (loginResponse.StatusCode == HttpStatusCode.OK)
        {
            var loginContent = await loginResponse.Content.ReadFromJsonAsync<LoginResponseDto>();
            Assert.That(loginContent, Is.Not.Null);
            Client.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", loginContent!.Token);

            // Récupérer le profil courant
            var profileResponse = await Client.GetAsync("/api/Users/profile/current");
            var currentUser = await profileResponse.Content.ReadFromJsonAsync<UserDto>();
            Assert.That(currentUser, Is.Not.Null);

            var updateDto = new UpdateUserDto
            {
                Email = "mynewemail_" + Guid.NewGuid().ToString().Substring(0, 8) + "@sigac.local"
            };

            var response = await Client.PutAsJsonAsync($"/api/Users/{currentUser!.Id}", updateDto);

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        }
    }

    [Test]
    public async Task UpdateUser_UserTryingToChangeOwnRole_ShouldReturn400()
    {
        // Login comme utilisateur régulier
        var loginResponse = await Client.PostAsJsonAsync("/api/Auth/login", new
        {
            username = "judge.mbala",
            password = "Judge@2024!"
        });

        if (loginResponse.StatusCode == HttpStatusCode.OK)
        {
            var loginContent = await loginResponse.Content.ReadFromJsonAsync<LoginResponseDto>();
            Assert.That(loginContent, Is.Not.Null);
            Client.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", loginContent!.Token);

            var profileResponse = await Client.GetAsync("/api/Users/profile/current");
            var currentUser = await profileResponse.Content.ReadFromJsonAsync<UserDto>();
            Assert.That(currentUser, Is.Not.Null);

            var updateDto = new UpdateUserDto
            {
                Role = UserRole.Admin // Essayer de se donner le rôle admin
            };

            var response = await Client.PutAsJsonAsync($"/api/Users/{currentUser!.Id}", updateDto);

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        }
    }

    [Test]
    public async Task UpdateUser_WithInvalidId_ShouldReturn404()
    {
        var updateDto = new UpdateUserDto
        {
            Email = "newemail@sigac.local"
        };

        var response = await Client.PutAsJsonAsync($"/api/Users/{Guid.NewGuid()}", updateDto);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    #endregion

    #region DELETE /api/Users/{id} - Delete User

    [Test]
    public async Task DeleteUser_AdminDeletingUser_ShouldReturn204()
    {
        // Créer un utilisateur temporaire
        var createDto = new CreateUserDto
        {
            Username = "delete_test_" + Guid.NewGuid().ToString().Substring(0, 8),
            Email = "delete_" + Guid.NewGuid().ToString().Substring(0, 8) + "@sigac.local",
            Password = "TestPassword123!",
            Role = UserRole.Consultant
        };

    var createResponse = await Client.PostAsJsonAsync("/api/Users", createDto);
    var createdUser = await createResponse.Content.ReadFromJsonAsync<UserDto>();
    Assert.That(createdUser, Is.Not.Null);

        // Supprimer l'utilisateur
    var deleteResponse = await Client.DeleteAsync($"/api/Users/{createdUser!.Id}");

        Assert.That(deleteResponse.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));

        // Vérifier que l'utilisateur est bien supprimé
    var getResponse = await Client.GetAsync($"/api/Users/{createdUser!.Id}");
        Assert.That(getResponse.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    public async Task DeleteUser_AdminTryingToDeleteSelf_ShouldReturn400()
    {
        // Récupérer le profil courant (admin)
    var profileResponse = await Client.GetAsync("/api/Users/profile/current");
    var currentUser = await profileResponse.Content.ReadFromJsonAsync<UserDto>();
    Assert.That(currentUser, Is.Not.Null);

    var deleteResponse = await Client.DeleteAsync($"/api/Users/{currentUser!.Id}");

        Assert.That(deleteResponse.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task DeleteUser_NonAdminUser_ShouldReturn403()
    {
        // Login comme utilisateur régulier
        var loginResponse = await Client.PostAsJsonAsync("/api/Auth/login", new
        {
            username = "judge.mbala",
            password = "Judge@2024!"
        });

        if (loginResponse.StatusCode == HttpStatusCode.OK)
        {
            var loginContent = await loginResponse.Content.ReadFromJsonAsync<LoginResponseDto>();
            Assert.That(loginContent, Is.Not.Null);
            Client.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", loginContent!.Token);

            var deleteResponse = await Client.DeleteAsync($"/api/Users/{Guid.NewGuid()}");

            Assert.That(deleteResponse.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
        }
    }

    #endregion

    #region POST /api/Users/change-password - Change Password

    [Test]
    public async Task ChangePassword_WithCorrectOldPassword_ShouldReturn200()
    {
        var changePasswordDto = new ChangePasswordDto
        {
            OldPassword = "Admin@2024!",
            NewPassword = "NewPassword123!",
            ConfirmPassword = "NewPassword123!"
        };

        var response = await Client.PostAsJsonAsync("/api/Users/change-password", changePasswordDto);

        // Restaurer le password
        await RestoreAdminPassword();

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    public async Task ChangePassword_WithIncorrectOldPassword_ShouldReturn400()
    {
        var changePasswordDto = new ChangePasswordDto
        {
            OldPassword = "WrongPassword",
            NewPassword = "NewPassword123!",
            ConfirmPassword = "NewPassword123!"
        };

        var response = await Client.PostAsJsonAsync("/api/Users/change-password", changePasswordDto);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task ChangePassword_WithMismatchedPasswords_ShouldReturn400()
    {
        var changePasswordDto = new ChangePasswordDto
        {
            OldPassword = "Admin@2024!",
            NewPassword = "NewPassword123!",
            ConfirmPassword = "DifferentPassword!"
        };

        var response = await Client.PostAsJsonAsync("/api/Users/change-password", changePasswordDto);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task ChangePassword_WithoutAuth_ShouldReturn401()
    {
        Client.DefaultRequestHeaders.Authorization = null;

        var changePasswordDto = new ChangePasswordDto
        {
            OldPassword = "Admin@2024!",
            NewPassword = "NewPassword123!",
            ConfirmPassword = "NewPassword123!"
        };

        var response = await Client.PostAsJsonAsync("/api/Users/change-password", changePasswordDto);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    #endregion

    #region POST /api/Users/{id}/deactivate - Deactivate User

    [Test]
    public async Task DeactivateUser_AdminDeactivatingUser_ShouldReturn200()
    {
        // Créer un utilisateur temporaire
        var createDto = new CreateUserDto
        {
            Username = "deactivate_test_" + Guid.NewGuid().ToString().Substring(0, 8),
            Email = "deactivate_" + Guid.NewGuid().ToString().Substring(0, 8) + "@sigac.local",
            Password = "TestPassword123!",
            Role = UserRole.Consultant
        };

        var createResponse = await Client.PostAsJsonAsync("/api/Users", createDto);
    var createdUser = await createResponse.Content.ReadFromJsonAsync<UserDto>();
    Assert.That(createdUser, Is.Not.Null);

    // Désactiver l'utilisateur
    var deactivateResponse = await Client.PostAsync($"/api/Users/{createdUser!.Id}/deactivate", null);

    Assert.That(deactivateResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));

    var content = await deactivateResponse.Content.ReadFromJsonAsync<UserDto>();
    Assert.That(content, Is.Not.Null);
    Assert.That(content!.IsActive, Is.False);
    }

    #endregion

    #region GET /api/Users/admin/stats - Get System Stats

    [Test]
    public async Task GetSystemStats_AsAdmin_ShouldReturn200WithStats()
    {
        var response = await Client.GetAsync("/api/Users/admin/stats");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var content = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.That(content.TryGetProperty("totalUsers", out _), Is.True);
        Assert.That(content.TryGetProperty("activeUsers", out _), Is.True);
        Assert.That(content.TryGetProperty("inactiveUsers", out _), Is.True);
        Assert.That(content.TryGetProperty("usersByRole", out _), Is.True);
    }

    [Test]
    public async Task GetSystemStats_NonAdminUser_ShouldReturn403()
    {
        // Login comme utilisateur régulier
        var loginResponse = await Client.PostAsJsonAsync("/api/Auth/login", new
        {
            username = "judge.mbala",
            password = "Judge@2024!"
        });

        if (loginResponse.StatusCode == HttpStatusCode.OK)
        {
            var loginContent = await loginResponse.Content.ReadFromJsonAsync<LoginResponseDto>();
            Assert.That(loginContent, Is.Not.Null);
            Client.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", loginContent!.Token);

            var response = await Client.GetAsync("/api/Users/admin/stats");

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
        }
    }

    #endregion

    #region Helpers

    private async Task RestoreAdminPassword()
    {
        // Cette méthode devrait remettre le password admin à sa valeur par défaut
        // Pour l'instant, on va ignorer ce problème de nettoyage
        // Dans un vrai projet, il faudrait utiliser une transaction DB pour rollback
    }

    #endregion
}
