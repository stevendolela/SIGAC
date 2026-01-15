using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;
using System;
using System.Threading.Tasks;

namespace SIGAC.Core.Interfaces;

/// <summary>
/// Interface pour le service d'import en masse de documents
/// </summary>
public interface IBulkDocumentImportService
{
    /// <summary>
    /// Importe en masse des documents
    /// </summary>
    Task<BulkImportDocumentsResultDto> ImportDocumentsAsync(
        BulkImportDocumentsDto importData,
        Guid userId,
        UserRole userRole);
}
