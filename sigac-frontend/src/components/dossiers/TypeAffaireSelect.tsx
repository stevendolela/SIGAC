import React from 'react';
import { useTypeAffaires } from '../../hooks/useTypeAffaires';

type Props = {
  value?: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
};

export const TypeAffaireSelect: React.FC<Props> = ({ value, onChange, disabled }) => {
  const { items, loading, error } = useTypeAffaires();

  if (loading) return <span>Chargement des types...</span>;
  if (error) return <span>Erreur: {error}</span>;

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
    >
      <option value="">-- Sélectionner une catégorie --</option>
      {items.map((t) => (
        <option key={t.id} value={t.id}>{t.nom}</option>
      ))}
    </select>
  );
};
