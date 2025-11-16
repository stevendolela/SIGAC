using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using NUnit.Framework;
using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;
using SIGAC.Tests.Helpers;

namespace SIGAC.Tests.Integration;

[TestFixture]
public class DossiersControllerTests : IntegrationTestBase
{
    [SetUp]
    public async Task Setup()
    {
        await InitializeAsync();

        // Login as admin and set token
        var loginResp = await Client.PostAsJsonAsync("/api/Auth/login", new { username = "admin", password = "Admin@2024!" });
        if (loginResp.StatusCode != HttpStatusCode.OK)
        {
            var body = await loginResp.Content.ReadAsStringAsync();
            Console.WriteLine("[DEBUG] Login response body: " + body);
        }
        Assert.That(loginResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    var loginJson = await loginResp.Content.ReadAsStringAsync();
    var login = System.Text.Json.JsonSerializer.Deserialize<LoginResponseDto>(loginJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login!.Token);
    }

    [TearDown]
    public async Task Teardown()
    {
        await DisposeAsync();
    }

    [Test]
    public async Task GetDossiers_ReturnsPagedList()
    {
        var resp = await Client.GetAsync("/api/Dossiers?page=1&pageSize=10");
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.OK));

    var pagedJson = await resp.Content.ReadAsStringAsync();
    var paged = System.Text.Json.JsonSerializer.Deserialize<PaginatedResult<DossierListDto>>(pagedJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.That(paged, Is.Not.Null);
        Assert.That(paged!.Data, Is.Not.Null);
        Assert.That(paged.Data.Count, Is.GreaterThan(0));
    }

    [Test]
    public async Task GetDossierById_ReturnsDetail()
    {
        // Retrieve list to get an existing dossier id
        var listResp = await Client.GetAsync("/api/Dossiers?page=1&pageSize=5");
        Assert.That(listResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    var pagedJson = await listResp.Content.ReadAsStringAsync();
    var paged = System.Text.Json.JsonSerializer.Deserialize<PaginatedResult<DossierListDto>>(pagedJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.That(paged, Is.Not.Null);
        var first = paged!.Data.FirstOrDefault();
        Assert.That(first, Is.Not.Null);

        var detailResp = await Client.GetAsync($"/api/Dossiers/{first!.Id}");
        Assert.That(detailResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));

    var detailJson = await detailResp.Content.ReadAsStringAsync();
    var detail = System.Text.Json.JsonSerializer.Deserialize<DossierDetailDto>(detailJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.That(detail, Is.Not.Null);
        Assert.That(detail!.Id, Is.EqualTo(first.Id));
    }
}
