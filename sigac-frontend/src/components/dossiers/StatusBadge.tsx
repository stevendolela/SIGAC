import React from 'react'

export type StatusType = 'Nouveau' | 'EnInstruction' | 'EnDelibere' | 'Juge' | 'Classe' | string
export type PrioriteType = 'Urgente' | 'Haute' | 'Normale' | 'Basse' | string

interface StatusBadgeProps {
  status?: StatusType
  priorite?: PrioriteType
  kind: 'status' | 'priorite'
}

const statusMeta: Record<string, { text: string; icon: string; cls: string }> = {
  Nouveau: { text: 'Nouveau', icon: '🆕', cls: 'status-nouveau' },
  EnInstruction: { text: 'En instruction', icon: '📝', cls: 'status-instruction' },
  EnDelibere: { text: 'En délibéré', icon: '💭', cls: 'status-delibere' },
  Juge: { text: 'Jugé', icon: '✅', cls: 'status-juge' },
  Classe: { text: 'Classé', icon: '📦', cls: 'status-classe' }
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
