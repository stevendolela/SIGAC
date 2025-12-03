using SIGAC.Core.DTOs;
using SIGAC.Core.Interfaces;

namespace SIGAC.Core.Services;

// Stub côté Core pour éviter toute dépendance à EF/Infrastructure. L'impl réelle est dans Infrastructure.Services.
public class SearchServiceStub : ISearchService
{
    public async Task<List<SearchResultDto>> SearchDossiersAsync(string query, int limit = 50)
    {
        await Task.CompletedTask;
        throw new NotSupportedException("SearchService implémenté dans SIGAC.Infrastructure.Services. Vérifiez l'enregistrement DI.");
    }

    public async Task<List<SearchResultDto>> SearchDocumentsAsync(string query, int limit = 50)
    {
        await Task.CompletedTask;
        throw new NotSupportedException("SearchService implémenté dans SIGAC.Infrastructure.Services. Vérifiez l'enregistrement DI.");
    }
}
