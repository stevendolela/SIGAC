import type { UserRole } from '../types/user'

/**
 * Migre les anciens noms de rôles vers les nouveaux
 * Utilisé pour la compatibilité avec les données en cache
 */
const roleMapping: Record<string, UserRole> = {
  // Anciens noms → Nouveaux noms
  'Administrateur': 'Admin',
  'President': 'Manager',
  'JugeConstitutionnel': 'Collaborateur',
  'Greffier': 'Assistant',
  'GreffierAdjoint': 'AssistantJunior',
  'Consultant': 'Consultant',
  
  // Nouveaux noms (passthrough)
  'Admin': 'Admin',
  'Manager': 'Manager',
  'Collaborateur': 'Collaborateur',
  'Assistant': 'Assistant',
  'AssistantJunior': 'AssistantJunior'
}

/**
 * Migre un rôle ancien vers le nouveau format
 */
export function migrateRole(oldRole: string): UserRole {
  return roleMapping[oldRole] || (oldRole as UserRole)
}

/**
 * Migre les données utilisateur en cache (localStorage)
 * À appeler au démarrage de l'application
 */
export function migrateUserDataInCache(): void {
  try {
    // Migrer l'utilisateur en localStorage
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      if (user.role && roleMapping[user.role]) {
        user.role = roleMapping[user.role]
        localStorage.setItem('user', JSON.stringify(user))
        // User role migrated successfully
      }
    }
  } catch (error) {
    console.error('Erreur migration cache utilisateur:', error)
  }
}

/**
 * Vérifie si un rôle est valide
 */
export function isValidRole(role: string): role is UserRole {
  const validRoles: UserRole[] = [
    'Admin',
    'Manager',
    'Collaborateur',
    'Assistant',
    'AssistantJunior',
    'Consultant'
  ]
  return validRoles.includes(role as UserRole)
}
