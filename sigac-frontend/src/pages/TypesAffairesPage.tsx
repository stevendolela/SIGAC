import { useEffect, useMemo, useState } from 'react'
import { TypeAffaireApi, TypeAffaireDto, CreateTypeAffaireDto } from '../api/typeAffaireApi'
import { useToast } from '../components/common/ToastProvider'

export const TypesAffairesPage = () => {
  const api = useMemo(() => new TypeAffaireApi(), [])
  const { notify } = useToast()
  const [items, setItems] = useState<TypeAffaireDto[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TypeAffaireDto | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreateTypeAffaireDto>({ nom: '', description: '' })

  const reload = () => {
    setLoading(true)
    api.list()
      .then(setItems)
      .catch((e) => notify({ type: 'error', message: e?.message || 'Erreur de chargement' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  const openCreateModal = () => {
    setEditingItem(null)
    setFormData({ nom: '', description: '' })
    setIsModalOpen(true)
  }

  const openEditModal = (item: TypeAffaireDto) => {
    setEditingItem(item)
    setFormData({ nom: item.nom, description: item.description || '' })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
    setFormData({ nom: '', description: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nom.trim() || formData.nom.trim().length < 3) {
      notify({ type: 'error', message: '⚠️ Le nom est requis (min. 3 caractères)' })
      return
    }

    setSubmitting(true)
    try {
      if (editingItem) {
        await api.update(editingItem.id, { 
          nom: formData.nom.trim(), 
          description: formData.description?.trim() 
        })
        notify({ type: 'success', message: '✅ Type d\'affaire modifié avec succès' })
      } else {
        await api.create({ 
          nom: formData.nom.trim(), 
          description: formData.description?.trim() 
        })
        notify({ type: 'success', message: '✅ Type d\'affaire créé avec succès' })
      }
      closeModal()
      reload()
    } catch (e: any) {
      notify({ type: 'error', message: e?.message || 'Erreur lors de l\'enregistrement' })
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (item: TypeAffaireDto) => {
    if (!confirm(`Supprimer le type "${item.nom}" ?`)) return
    try {
      await api.remove(item.id)
      notify({ type: 'success', message: '✅ Type d\'affaire supprimé' })
      reload()
    } catch (e: any) {
      notify({ type: 'error', message: e?.message || 'Erreur de suppression' })
    }
  }

  return (
    <div className="panel">
      <div className="panel-title">📋 Types d'Affaires</div>

      {/* Action button */}
      <div style={{ marginBottom: 20 }}>
        <button 
          className="btn" 
          onClick={openCreateModal}
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 8 
          }}
        >
          ➕ Nouveau Type d'Affaire
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 48, 
          color: '#6b7280' 
        }}>
          <div style={{
            width: 48,
            height: 48,
            border: '4px solid #e5e7eb',
            borderTopColor: '#1e3a8a',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          Chargement...
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th style={{ width: 200, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: '#111827' }}>{item.nom}</td>
                  <td style={{ color: '#6b7280' }}>
                    {item.description || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>—</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => openEditModal(item)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 13 }}
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        style={{
                          backgroundColor: 'white',
                          color: '#dc2626',
                          border: '2px solid #dc2626',
                          borderRadius: 10,
                          padding: '6px 12px',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ 
                    padding: 48, 
                    textAlign: 'center', 
                    color: '#9ca3af' 
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>📋</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                      Aucun type d'affaire pour l'instant.
                    </div>
                    <div style={{ fontSize: 13, marginTop: 8, opacity: 0.7 }}>
                      Cliquez sur "Nouveau Type d'Affaire" pour commencer.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            @keyframes modalFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes modalSlideIn {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              animation: 'modalFadeIn 0.2s ease-out'
            }}
          >
            {/* Overlay */}
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                cursor: 'pointer'
              }}
              onClick={closeModal}
            />
            
            {/* Modal */}
            <div 
              style={{
                position: 'relative',
                backgroundColor: 'white',
                borderRadius: 16,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                width: '100%',
                maxWidth: 700,
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: 'modalSlideIn 0.3s ease-out'
              }}
            >
              {/* Header */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20px 24px',
                  borderBottom: '1px solid #e5e7eb',
                  background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.05) 0%, rgba(14, 165, 233, 0.05) 100%)'
                }}
              >
                <h3 style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#111827',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  {editingItem ? '✏️ Modifier le type d\'affaire' : '➕ Nouveau type d\'affaire'}
                </h3>
                <button
                  onClick={closeModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    fontSize: 24,
                    padding: 4,
                    lineHeight: 1,
                    transition: 'color 0.2s'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div style={{
                padding: 24,
                overflowY: 'auto',
                flex: 1
              }}>
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Nom field */}
                    <div className="form-group">
                      <label>Nom du Type d'Affaire *</label>
                      <input
                        type="text"
                        placeholder="Ex: Contentieux Électoral"
                        value={formData.nom}
                        onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                        required
                        autoFocus
                      />
                    </div>

                    {/* Description field */}
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        placeholder="Description optionnelle du type d'affaire..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        style={{ width: '100%', fontFamily: 'inherit' }}
                      />
                    </div>

                    {/* Info box */}
                    <div style={{ 
                      padding: 16, 
                      background: 'rgba(59, 130, 246, 0.1)', 
                      borderLeft: '4px solid #3b82f6',
                      borderRadius: 8
                    }}>
                      <div style={{ fontSize: 13, color: '#1e40af', fontWeight: 500, marginBottom: 4 }}>
                        💡 Information
                      </div>
                      <div style={{ fontSize: 12, color: '#475569' }}>
                        Le nom du type d'affaire est obligatoire et doit contenir au moins 3 caractères.
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 12,
                      marginTop: 8
                    }}>
                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={closeModal}
                        disabled={submitting}
                      >
                        Annuler
                      </button>
                      <button 
                        type="submit" 
                        className="btn"
                        disabled={submitting || !formData.nom.trim()}
                        style={{ minWidth: 160 }}
                      >
                        {submitting ? '⏳ Enregistrement...' : (editingItem ? '✅ Enregistrer' : '✅ Créer')}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default TypesAffairesPage
