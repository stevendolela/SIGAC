import React from 'react'

export type StatusType = 'Nouveau' | 'EnCours' | 'EnValidation' | 'Valide' | 'Termine' | string
export type PrioriteType = 'Urgente' | 'Haute' | 'Normale' | 'Basse' | string

interface StatusBadgeProps {
  status?: StatusType
  priorite?: PrioriteType
  kind: 'status' | 'priorite'
}

const statusMeta: Record<string, { text: string; icon: string; cls: string }> = {
  Nouveau: { text: 'Nouveau', icon: '🆕', cls: 'status-nouveau' },
  EnCours: { text: 'En cours', icon: '📝', cls: 'status-cours' },
  EnValidation: { text: 'En validation', icon: '💭', cls: 'status-validation' },
  Valide: { text: 'Validé', icon: '✅', cls: 'status-valide' },
  Termine: { text: 'Terminé', icon: '📦', cls: 'status-termine' }
}

const prioriteMeta: Record<string, { text: string; icon: string; cls: string }> = {
  Urgente: { text: 'Urgente', icon: '🔴', cls: 'priorite-critique' },
  Haute: { text: 'Haute', icon: '🟡', cls: 'priorite-haute' },
  Normale: { text: 'Normale', icon: '⚪', cls: 'priorite-normale' },
  Basse: { text: 'Basse', icon: '⚪', cls: 'priorite-normale' }
}

export function StatusBadge({ status, priorite, kind }: StatusBadgeProps) {
  const value = kind === 'status' ? (status || 'Nouveau') : (priorite || 'Normale')
  const meta = kind === 'status' ? statusMeta[value] : prioriteMeta[value]
  if (!meta) {
    return <span className="badge" style={{ background: '#f3f4f6', color: '#374151' }}>{value || '-'}</span>
  }
  return (
    <span className={`badge ${meta.cls}`} aria-label={`${kind === 'status' ? 'Statut' : 'Priorité'}: ${meta.text}`}>
      {meta.icon} {meta.text}
    </span>
  )
}
