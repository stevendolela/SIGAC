using SIGAC.Core.DTOs;

namespace SIGAC.Core.Interfaces;

public interface ISearchService
{
    Task<List<SearchResultDto>> SearchDossiersAsync(string query, int limit = 50);
    Task<List<SearchResultDto>> SearchDocumentsAsync(string query, int limit = 50);
}
