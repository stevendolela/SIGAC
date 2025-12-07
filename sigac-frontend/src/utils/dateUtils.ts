/**
 * Utilitaires pour la gestion des dates
 * Résout les problèmes de décalage timezone
 */

/**
 * Convertit une chaîne de date ISO en objet Date
 * Utilise la date locale sans changement de timezone
 */
export function parseDateString(dateStr: string): Date {
  // Format attendu: "2025-12-12" ou "2025-12-12T14:30:00"
  const parts = dateStr.split('T')[0].split('-')
  if (parts.length !== 3) {
    throw new Error(`Format de date invalide: ${dateStr}`)
  }
  
  const [year, month, day] = parts.map(Number)
  // Créer la date dans le timezone local
  return new Date(year, month - 1, day)
}

/**
 * Convertit une date en chaîne ISO (YYYY-MM-DD)
 * Utilise la date locale sans changement de timezone
 */
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Compare deux dates (ignorant l'heure)
 */
export function isSameDate(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate()
}

/**
 * Obtient le numéro du jour de la semaine (1 = lundi, 7 = dimanche)
 * Utile pour les calendriers en Europe
 */
export function getDayOfWeekEU(date: Date): number {
  const day = date.getDay()
  return day === 0 ? 7 : day // 0 (dimanche) -> 7, 1-6 (lun-sam) -> 1-6
}

/**
 * Obtient les jours du mois pour un calendrier
 * Align eur calendrier européen (lun-dim)
 */
export function getDaysInMonthEU(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  
  // getDay() retourne 0-6 (dim-sam), convertir pour EU (lun-dim)
  const startingDayOfWeek = getDayOfWeekEU(firstDay)
  
  const days: (Date | null)[] = []
  
  // Ajouter les jours vides du début (lundi = 1)
  for (let i = 1; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  
  // Ajouter tous les jours du mois
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day))
  }
  
  return days
}
