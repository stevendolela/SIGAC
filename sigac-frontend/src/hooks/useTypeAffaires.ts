import { useEffect, useState, useMemo } from 'react';
import { TypeAffaireApi, TypeAffaireDto } from '../api/typeAffaireApi';

export function useTypeAffaires() {
  const api = useMemo(() => new TypeAffaireApi(), []);
  const [items, setItems] = useState<TypeAffaireDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.list()
      .then(setItems)
      .catch((e) => setError(e?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [api]);

  return { items, loading, error };
}
