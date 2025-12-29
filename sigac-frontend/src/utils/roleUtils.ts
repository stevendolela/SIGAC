import type { UserRole } from '../types/user'

/**
 * Labels lisibles pour les rôles utilisateur avec émojis
 */
export const roleLabels: Record<UserRole, string> = {
  'Admin': '👑 Admin',
  'Manager': '👔 Manager',
  'Collaborateur': '👨‍💼 Collaborateur',
  'Assistant': '📋 Assistant',
  'AssistantJunior': '🎓 Assistant Junior',
  'Consultant': '👁️ Consultant'
}

/**
 * Labels courts sans émojis pour affichage compact
 */
export const roleLabelsShort: Record<UserRole, string> = {
  'Admin': 'Admin',
  'Manager': 'Manager',
  'Collaborateur': 'Collaborateur',
  'Assistant': 'Assistant',
  'AssistantJunior': 'Assistant Junior',
  'Consultant': 'Consultant'
}

/**
 * Descriptions des rôles pour tooltips/aide
 */
export const roleDescriptions: Record<UserRole, string> = {
  'Admin': 'Administrateur système avec accès complet',
  'Manager': 'Directeur/Responsable avec vue globale',
  'Collaborateur': 'Expert/Professionnel assigné aux dossiers',
  'Assistant': 'Gestionnaire administratif des dossiers',
  'AssistantJunior': 'Support administratif/Stagiaire',
  'Consultant': 'Expert externe avec accès en lecture seule'
}

/**
 * Formate un rôle pour l'affichage avec émoji
 */
export function formatRole(role: UserRole): string {
  return roleLabels[role] || role
}

/**
 * Formate un rôle pour l'affichage court (sans émoji)
 */
export function formatRoleShort(role: UserRole): string {
  return roleLabelsShort[role] || role
}

/**
 * Obtient la description d'un rôle
 */
export function getRoleDescription(role: UserRole): string {
  return roleDescriptions[role] || ''
}

/**
 * Liste de tous les rôles disponibles
 */
export const allRoles: UserRole[] = [
  'Admin',
  'Manager', 
  'Collaborateur',
  'Assistant',
  'AssistantJunior',
  'Consultant'
]
