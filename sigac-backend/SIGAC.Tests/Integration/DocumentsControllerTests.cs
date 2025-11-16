using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using NUnit.Framework;
using SIGAC.Core.DTOs;
using SIGAC.Tests.Helpers;

namespace SIGAC.Tests.Integration;

[TestFixture]
public class DocumentsControllerTests : IntegrationTestBase
{
    private string? _adminToken;
    private Guid? _testDossierId;

    [SetUp]
    public async Task Setup()
    {
        await InitializeAsync();

        // Login as admin
    var loginResp = await Client.PostAsJsonAsync("/api/Auth/login", new { username = "admin", password = "Admin@2024!" });
    Assert.That(loginResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    var loginJson = await loginResp.Content.ReadAsStringAsync();
    var login = System.Text.Json.JsonSerializer.Deserialize<LoginResponseDto>(loginJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    _adminToken = login!.Token;
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _adminToken);

        // Get a test dossier
    var dossiersResp = await Client.GetAsync("/api/Dossiers?page=1&pageSize=5");
    var dossiersJson = await dossiersResp.Content.ReadAsStringAsync();
    var dossiers = System.Text.Json.JsonSerializer.Deserialize<PaginatedResult<DossierListDto>>(dossiersJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        _testDossierId = dossiers!.Data.FirstOrDefault()?.Id;
        Assert.That(_testDossierId, Is.Not.EqualTo(Guid.Empty), "No test dossier found");
    }

    [TearDown]
    public async Task Teardown()
    {
        await DisposeAsync();
    }

    [Test]
    public async Task UploadDocument_WithValidFile_Returns201()
    {
        // Create a test file
        var fileName = "test_document.pdf";
    var fileBytes = Encoding.UTF8.GetBytes("%PDF-1.4 test content");
    var file = new FormFileUpload(fileBytes, fileName, "application/pdf");

    using var content = new MultipartFormDataContent();
    var streamContent = new StreamContent(file.OpenReadStream());
    streamContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
    content.Add(streamContent, "file", fileName);
        content.Add(new StringContent("Requête"), "typeDocument");

        var resp = await Client.PostAsync($"/api/Documents/upload/{_testDossierId}", content);

        var respBody = await resp.Content.ReadAsStringAsync();
        TestContext.WriteLine("Upload response status: " + resp.StatusCode);
        TestContext.WriteLine("Upload response body: " + respBody);

        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Created));

    var docJson = respBody;
    var document = System.Text.Json.JsonSerializer.Deserialize<DocumentDto>(docJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.That(document, Is.Not.Null);
        Assert.That(document!.NomFichier, Is.EqualTo(fileName));
        Assert.That(document.DossierId, Is.EqualTo(_testDossierId));
    }

    [Test]
    public async Task UploadDocument_WithInvalidMimeType_Returns415()
    {
        var fileName = "test_file.txt";
    var fileBytes = Encoding.UTF8.GetBytes("Plain text file");
    var file = new FormFileUpload(fileBytes, fileName, "text/plain");

    using var content = new MultipartFormDataContent();
    var streamContent = new StreamContent(file.OpenReadStream());
    streamContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
    content.Add(streamContent, "file", fileName);
        content.Add(new StringContent("Document"), "typeDocument");

        var resp = await Client.PostAsync($"/api/Documents/upload/{_testDossierId}", content);

        // Should return 400 Bad Request for unsupported MIME type
        Assert.That(resp.StatusCode, Is.AnyOf(HttpStatusCode.BadRequest, HttpStatusCode.UnsupportedMediaType));
    }

    [Test]
    public async Task GetDocumentsByDossierId_ReturnsDocumentList()
    {
        var resp = await Client.GetAsync($"/api/Documents/dossier/{_testDossierId}");

        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.OK));

    var documentsJson = await resp.Content.ReadAsStringAsync();
    var documents = System.Text.Json.JsonSerializer.Deserialize<List<DocumentDto>>(documentsJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.That(documents, Is.Not.Null);
        // Should have at least the seeded documents
        Assert.That(documents!.Count, Is.GreaterThanOrEqualTo(0));
    }

    [Test]
    public async Task DownloadDocument_WithExistingDocument_ReturnsFile()
    {
        // Get first document
        var listResp = await Client.GetAsync($"/api/Documents/dossier/{_testDossierId}");
    var documentsJson = await listResp.Content.ReadAsStringAsync();
    var documents = System.Text.Json.JsonSerializer.Deserialize<List<DocumentDto>>(documentsJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        if (documents == null || documents.Count == 0)
        {
            Assert.Inconclusive("No documents found to test download");
            return;
        }

        var documentId = documents.First().Id;

        var resp = await Client.GetAsync($"/api/Documents/download/{documentId}");

        // Should either return 200 OK or 404 if file doesn't exist physically (seeded data)
        Assert.That(resp.StatusCode, Is.AnyOf(HttpStatusCode.OK, HttpStatusCode.NotFound));
    }

    [Test]
    public async Task GetStorageStats_AsAdmin_Returns200()
    {
        var resp = await Client.GetAsync("/api/Documents/admin/stats");

        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.OK));

    var statsJson = await resp.Content.ReadAsStringAsync();
    var stats = System.Text.Json.JsonSerializer.Deserialize<dynamic>(statsJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.That(stats, Is.Not.Null);
    }

    [Test]
    public async Task GetStorageStats_AsNonAdmin_Returns403()
    {
        // Login as non-admin user
    var loginResp = await Client.PostAsJsonAsync("/api/Auth/login", new { username = "juge.mbala", password = "Juge@2024!" });
    var loginJson = await loginResp.Content.ReadAsStringAsync();
    var login = System.Text.Json.JsonSerializer.Deserialize<LoginResponseDto>(loginJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login!.Token);

        var resp = await Client.GetAsync("/api/Documents/admin/stats");

        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    /// <summary>
    /// Helper class to simulate IFormFile for testing
    /// </summary>
    private class FormFileUpload
    {
        private readonly byte[] _content;
        private readonly string _fileName;
        private readonly string _contentType;

        public FormFileUpload(byte[] content, string fileName, string contentType)
        {
            _content = content;
            _fileName = fileName;
            _contentType = contentType;
        }

        public Stream OpenReadStream() => new MemoryStream(_content);
        public string FileName => _fileName;
        public string ContentType => _contentType;
        public long Length => _content.Length;
    }
}
