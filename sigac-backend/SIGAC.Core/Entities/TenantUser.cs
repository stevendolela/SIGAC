using System;
using System.Collections.Generic;

namespace SIGAC.Core.Entities
{
    /// <summary>
    /// TenantUser - Utilisateur au niveau Tenant (Client SaaS)
    /// Représente un utilisateur appartenant à un Tenant spécifique
    /// Niveau 1 de la hiérarchie users
    /// </summary>
    public class TenantUser
    {
        public Guid Id { get; set; }
        
        // Tenant Assignment
        public Guid TenantId { get; set; }
        
        // Identité
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        
        // Tenant-Level Role
        public int Role { get; set; } = (int)TenantRoleEnum.Member;        // Admin, Manager, Member
        
        // Status
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLoginAt { get; set; }
        
        // JWT Refresh Token
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiry { get; set; }
        
        // Relations
        public Tenant Tenant { get; set; } = null!;
        
        /// <summary>
        /// Assignations de l'utilisateur aux différents Workspaces (Départements)
        /// Un TenantUser peut être assigné à plusieurs Workspaces avec des rôles différents
        /// </summary>
        public ICollection<WorkspaceUser> WorkspaceAssignments { get; set; } = new List<WorkspaceUser>();
        
        public ICollection<AuditLog> Actions { get; set; } = new List<AuditLog>();
    }
    
    /// <summary>
    /// Tenant Role Enum - Rôles au niveau Tenant
    /// Contrôle l'accès global au Tenant
    /// </summary>
    public enum TenantRoleEnum
    {
        Admin = 0,        // Accès complet, gère tout le tenant
        Manager = 1,      // Gère workspaces et users
        Member = 2        // Accès selon assignation workspace
    }
}
