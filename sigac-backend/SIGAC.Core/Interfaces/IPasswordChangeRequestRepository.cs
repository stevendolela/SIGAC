using SIGAC.Core.Entities;

namespace SIGAC.Core.Interfaces;

public interface IPasswordChangeRequestRepository
{
    Task<PasswordChangeRequest?> GetByCodeAsync(string code);
    Task<PasswordChangeRequest?> GetByUserIdAsync(Guid userId);
    Task AddAsync(PasswordChangeRequest request);
    Task DeleteAsync(PasswordChangeRequest request);
    Task DeleteExpiredAsync();
    Task SaveChangesAsync();
}
