using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;
using System;
using System.Threading.Tasks;

namespace SIGAC.Core.Interfaces;

/// <summary>
/// Interface pour le service d'import en masse
/// </summary>
public interface IBulkImportService
{
    /// <summary>
    /// Importe en masse des dossiers
    /// </summary>
    Task<BulkImportResultDto> ImportDossiersAsync(
        BulkImportDossiersDto importData,
        Guid userId,
        UserRole userRole);
}
