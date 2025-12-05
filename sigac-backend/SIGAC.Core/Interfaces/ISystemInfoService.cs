using SIGAC.Core.DTOs;

namespace SIGAC.Core.Interfaces
{
    /// <summary>
    /// Interface pour le service d'informations système
    /// </summary>
    public interface ISystemInfoService
    {
        /// <summary>
        /// Récupère les informations système et API
        /// </summary>
        Task<SystemInfoDto> GetSystemInfoAsync();

        /// <summary>
        /// Obtient le statut de la base de données
        /// </summary>
        Task<string> GetDatabaseStatusAsync();
    }
}
