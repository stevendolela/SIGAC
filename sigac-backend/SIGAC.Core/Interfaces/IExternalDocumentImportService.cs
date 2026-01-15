using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace SIGAC.Core.Interfaces;

/// <summary>
/// Interface pour le service d'import de documents externes
/// </summary>
public interface IExternalDocumentImportService
{
    /// <summary>
    /// Importe des documents depuis une source externe
    /// </summary>
    /// <param name="source">Provider de la source (FTP, HTTP, S3, etc.)</param>
    /// <param name="config">Configuration de l'import</param>
    /// <param name="userId">ID de l'utilisateur effectuant l'import</param>
    /// <param name="userRole">Rôle de l'utilisateur</param>
    /// <param name="cancellationToken">Token d'annulation</param>
    /// <returns>Résultat détaillé de l'import</returns>
    Task<ExternalImportResultDto> ImportFromSourceAsync(
        IExternalDocumentSourceProvider source,
        ExternalDocumentImportConfigDto config,
        Guid userId,
        UserRole userRole,
        CancellationToken cancellationToken = default);
}
