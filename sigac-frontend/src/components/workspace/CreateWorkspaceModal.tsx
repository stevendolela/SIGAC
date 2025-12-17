import React, { useState } from 'react';
import { X, Building2, AlertCircle } from 'lucide-react';
import { useWorkspace } from '../../hooks/useWorkspace';
import './CreateWorkspaceModal.css';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createWorkspace, loading } = useWorkspace();
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      // Auto-générer slug depuis name si slug vide
      slug: prev.slug || generateSlug(name),
    }));
  };

  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever accents
      .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces, tirets
      .trim()
      .replace(/\s+/g, '-'); // Remplacer espaces par tirets
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Le nom est requis');
      return;
    }
    if (!formData.slug.trim()) {
      setError('Le slug est requis');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      setError('Le slug ne peut contenir que des lettres minuscules, chiffres et tirets');
      return;
    }

    try {
      await createWorkspace({
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || undefined,
      });
      
      // Reset form et fermer
      setFormData({ name: '', slug: '', description: '' });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création du workspace');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <Building2 size={24} className="modal-icon" />
            <h2>Créer un Workspace</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="modal-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="workspace-name" className="form-label">
              Nom du workspace <span className="required">*</span>
            </label>
            <input
              id="workspace-name"
              type="text"
              className="form-input"
              placeholder="Ex: Cour Constitutionnelle RDC"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <p className="form-hint">
              Nom de votre organisation ou équipe
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="workspace-slug" className="form-label">
              Slug (identifiant URL) <span className="required">*</span>
            </label>
            <input
              id="workspace-slug"
              type="text"
              className="form-input"
              placeholder="cc-rdc"
              value={formData.slug}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }))
              }
              disabled={loading}
            />
            <p className="form-hint">
              Uniquement lettres minuscules, chiffres et tirets
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="workspace-description" className="form-label">
              Description
            </label>
            <textarea
              id="workspace-description"
              className="form-textarea"
              placeholder="Description de votre workspace..."
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              disabled={loading}
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Création...' : 'Créer le workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkspaceModal;
