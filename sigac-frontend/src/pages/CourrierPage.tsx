import { useEffect, useState, useCallback, useRef } from 'react';
import courrierApi from '../api/courrierApi';
import workspaceApi from '../api/workspaceApi';
import { userApi } from '../api/userApi';
import type {
  CourrierListDto,
  CourrierDetailDto,
  CreateCourrierDto,
  TypeCourrier,
  StatutCourrier,
  UrgenceCourrier,
  CourrierStatsDto,
  ReceptionCourrierOcrDto
} from '../types/courrier';
import type { WorkspaceDto } from '../types/workspace';
import type { UserDto } from '../types/user';

// Constantes pour les labels et couleurs
const TYPE_COURRIER_LABELS: Record<string, string> = {
  Entrant: '📥 Entrant',
  Sortant: '📤 Sortant'
};

const STATUT_COURRIER_LABELS: Record<string, string> = {
  Recu: 'Reçu',
  EnTraitement: 'En Traitement',
  Traite: 'Traité',
  Archive: 'Archivé',
  Rejete: 'Rejeté'
};

const STATUT_COURRIER_COLORS: Record<string, string> = {
  Recu: '#3b82f6',
  EnTraitement: '#f59e0b',
  Traite: '#10b981',
  Archive: '#6b7280',
  Rejete: '#ef4444'
};

const URGENCE_COURRIER_LABELS: Record<string, string> = {
  Normale: 'Normale',
  Importante: 'Importante',
  Urgente: 'Urgente',
  TresUrgente: 'Très Urgente'
};

const URGENCE_COURRIER_COLORS: Record<string, string> = {
  Normale: '#10b981',
  Importante: '#f59e0b',
  Urgente: '#f97316',
  TresUrgente: '#ef4444'
};

export default function CourrierPage() {
  // États principaux
  const [courriers, setCourriers] = useState<CourrierListDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Filtres
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<TypeCourrier | ''>('')
  const [filterStatut, setFilterStatut] = useState<StatutCourrier | ''>('')
  const [filterUrgence, setFilterUrgence] = useState<UrgenceCourrier | ''>('')
  const [filterWorkspace, setFilterWorkspace] = useState('')

  // Données référentielles
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([])
  const [users, setUsers] = useState<UserDto[]>([])
  const [stats, setStats] = useState<CourrierStatsDto | null>(null)

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showOcrModal, setShowOcrModal] = useState(false)
  const [selectedCourrier, setSelectedCourrier] = useState<CourrierDetailDto | null>(null)

  // Formulaire création
  const [newCourrier, setNewCourrier] = useState<CreateCourrierDto>({
    type: 'Entrant',
    objet: '',
    expediteur: '',
    destinataire: '',
    dateCourrier: new Date().toISOString().split('T')[0],
    urgence: 'Normale'
  })
  const [newCourrierFile, setNewCourrierFile] = useState<File | null>(null)
  const [loadingCreateCourrier, setLoadingCreateCourrier] = useState(false)

  // OCR
  const [ocrFile, setOcrFile] = useState<File | null>(null)
  const [ocrData, setOcrData] = useState<ReceptionCourrierOcrDto>({
    type: 'Entrant',
    urgence: 'Normale'
  })
  const [ocrLoading, setOcrLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Info utilisateur
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Chargement initial
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      setIsAdmin(user.role === 'Admin' || user.role === 'Manager')
      setCurrentUserId(user.id)
    }
    // Chargement workspaces et users
    const loadWorkspaces = async () => {
      try {
        const ws = await workspaceApi.list();
        setWorkspaces(ws);
      } catch (e) { /* ignore */ }
    };
    const loadUsers = async () => {
      try {
        const us = await userApi.list();
        setUsers(us);
      } catch (e) { /* ignore */ }
    };
    loadWorkspaces();
    loadUsers();
  }, [])

  // Chargement des courriers
  useEffect(() => {
    loadCourriers();
  }, [page, search, filterType, filterStatut, filterUrgence, filterWorkspace]);

  // Chargement des statistiques
  useEffect(() => {
    loadStats();
  }, [filterWorkspace]);

  // Chargement des courriers
  const loadCourriers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await courrierApi.list({
        page,
        pageSize: 15,
        search: search || undefined,
        type: filterType || undefined,
        statut: filterStatut || undefined,
        urgence: filterUrgence || undefined,
        workspaceId: filterWorkspace || undefined
      });
      setCourriers(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.totalItems);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Erreur lors du chargement des courriers');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterType, filterStatut, filterUrgence, filterWorkspace]);

  // Chargement des stats
  const loadStats = useCallback(async () => {
    try {
      const statsData = await courrierApi.getStatistiques(filterWorkspace || undefined);
      setStats(statsData);
    } catch (e) { /* ignore */ }
  }, [filterWorkspace]);

  // Handler fichier joint
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewCourrierFile(e.target.files[0]);
    }
  };

  // Handler scan JS
  const handleScanJsForCourrier = async () => {
    try {
      const response = await fetch('http://localhost:27275/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'pdf' })
      });
      if (!response.ok) throw new Error('Erreur ScanJS: ' + response.statusText);
      const blob = await response.blob();
      const scannedFile = new File([blob], 'scanjs-document.pdf', { type: blob.type });
      setNewCourrierFile(scannedFile);
      alert('Scan terminé ! Document prêt à être joint.');
    } catch (err) {
      alert('Erreur lors du scan avec ScanJS. Vérifiez que ScanJS est bien lancé sur votre poste.');
    }
  };

  // Handler création courrier
  const handleCreateCourrier = async () => {
    setLoadingCreateCourrier(true);
    try {
      const formData = new FormData();
      Object.entries(newCourrier).forEach(([key, value]) => {
        if (value) formData.append(key, value as string);
      });
      if (newCourrierFile) {
        formData.append('file', newCourrierFile);
      }
      await courrierApi.createWithFile(formData);
      setShowCreateModal(false);
      setNewCourrierFile(null);
      setNewCourrier({
        type: 'Entrant',
        objet: '',
        expediteur: '',
        destinataire: '',
        dateCourrier: new Date().toISOString().split('T')[0],
        urgence: 'Normale'
      });
      loadCourriers();
      loadStats();
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la création du courrier');
    } finally {
      setLoadingCreateCourrier(false);
    }
  };

  const handleOcrReception = async () => {
    if (!ocrFile) return;
    setOcrLoading(true);
    try {
      const result = await courrierApi.receptionnerAvecOcr(ocrFile, ocrData);
      setShowOcrModal(false);
      setOcrFile(null);
      setOcrData({ type: 'Entrant', urgence: 'Normale' });
      loadCourriers();
      loadStats();
      // Afficher le résultat
      setSelectedCourrier(result);
      setShowDetailModal(true);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la réception OCR');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleChangerStatut = async (courrierId: string, nouveauStatut: StatutCourrier) => {
    try {
      const updated = await courrierApi.changerStatut(courrierId, nouveauStatut)
      setSelectedCourrier(updated)
      loadCourriers()
      loadStats()
    } catch (e: any) {
      setError(e.message || 'Erreur lors du changement de statut')
    }
  }

  const handleDownloadDocument = async (courrierId: string, filename: string) => {
    try {
      const blob = await courrierApi.downloadDocument(courrierId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || 'document'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e: any) {
      setError(e.message || 'Erreur lors du téléchargement')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  async function handleViewCourrier(courrier: CourrierListDto) {
    try {
      // On essaie de récupérer le détail complet si l'API le permet, sinon on utilise le DTO de liste
      // Comme l'API getById n'est pas explicitement visible, on suppose qu'elle existe ou on utilise le DTO liste
      // Pour l'instant on utilise le DTO liste casté, mais idéalement il faudrait un appel API
      // Si courrierApi.getById existe :
      // const detail = await courrierApi.getById(courrier.id);
      // setSelectedCourrier(detail);
      
      // Fallback sur le DTO liste (il manque peut-être l'historique)
      setSelectedCourrier(courrier as unknown as CourrierDetailDto);
      setShowDetailModal(true);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="courrier-page">
      {/* Header avec statistiques */}
      <div className="courrier-header">
        <div className="header-title">
          <h1>📬 Gestion du Courrier</h1>
          <span className="subtitle">{totalItems} courrier(s) au total</span>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <select 
            value={filterType} 
            onChange={(e) => { setFilterType(e.target.value as TypeCourrier | ''); setPage(1) }}
            className="filter-select"
          >
            <option value="">Tous types</option>
            <option value="Entrant">📥 Entrant</option>
            <option value="Sortant">📤 Sortant</option>
          </select>

          <select
            value={filterStatut}
            onChange={(e) => { setFilterStatut(e.target.value as StatutCourrier | ''); setPage(1) }}
            className="filter-select"
          >
          <option value="">Tous statuts</option>
          <option value="Recu">{STATUT_COURRIER_LABELS.Recu}</option>
          <option value="EnTraitement">{STATUT_COURRIER_LABELS.EnTraitement}</option>
          <option value="Traite">{STATUT_COURRIER_LABELS.Traite}</option>
          <option value="Archive">{STATUT_COURRIER_LABELS.Archive}</option>
          <option value="Rejete">{STATUT_COURRIER_LABELS.Rejete}</option>
        </select>

        <select
          value={filterUrgence}
          onChange={(e) => { setFilterUrgence(e.target.value as UrgenceCourrier | ''); setPage(1) }}
          className="filter-select"
        >
          <option value="">Toutes urgences</option>
          <option value="Normale">{URGENCE_COURRIER_LABELS.Normale}</option>
          <option value="Importante">{URGENCE_COURRIER_LABELS.Importante}</option>
          <option value="Urgente">{URGENCE_COURRIER_LABELS.Urgente}</option>
          <option value="TresUrgente">{URGENCE_COURRIER_LABELS.TresUrgente}</option>
        </select>
        {workspaces.length > 0 && (
          <select
            value={filterWorkspace}
            onChange={(e) => { setFilterWorkspace(e.target.value); setPage(1) }}
            className="filter-select"
          >
            <option value="">Tous workspaces</option>
            {workspaces.map(ws => (
              <option key={ws.id} value={ws.id}>{ws.name}</option>
            ))}
          </select>
        )}

          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            ➕ Nouveau
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="error-banner">
          ❌ {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Liste des courriers */}
      <div className="courrier-list">
        {loading ? (
          <div className="loading-state">⏳ Chargement...</div>
        ) : courriers.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>Aucun courrier trouvé</p>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              Créer un premier courrier
            </button>
          </div>
        ) : (
          <table className="courrier-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Type</th>
                <th>Objet</th>
                <th>Expéditeur</th>
                <th>Destinataire</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Urgence</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courriers.map(courrier => (
                <tr key={courrier.id} onClick={() => handleViewCourrier(courrier)}>
                  <td className="ref-cell">
                    <span className="reference">{courrier.reference}</span>
                    {courrier.hasDocument && <span className="has-doc" title="Document joint">📎</span>}
                  </td>
                  <td>
                    <span className={`type-badge ${(courrier.type || 'entrant').toLowerCase()}`}>
                      {TYPE_COURRIER_LABELS[courrier.type]}
                    </span>
                  </td>
                  <td className="objet-cell" title={courrier.objet}>
                    {courrier.objet.length > 40 ? courrier.objet.substring(0, 40) + '...' : courrier.objet}
                  </td>
                  <td>{courrier.expediteur}</td>
                  <td>{courrier.destinataire}</td>
                  <td>{formatDate(courrier.dateCourrier)}</td>
                  <td>
                    <span
                      className="statut-badge"
                      style={{ backgroundColor: STATUT_COURRIER_COLORS[courrier.statut] }}
                    >
                      {STATUT_COURRIER_LABELS[courrier.statut]}
                    </span>
                  </td>
                  <td>
                    <span
                      className="urgence-badge"
                      style={{ backgroundColor: URGENCE_COURRIER_COLORS[courrier.urgence] }}
                    >
                      {URGENCE_COURRIER_LABELS[courrier.urgence]}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-icon"
                      onClick={(e) => { e.stopPropagation(); handleViewCourrier(courrier) }}
                      title="Voir détails"
                    >
                      👁️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="btn btn-secondary"
          >
            ← Précédent
          </button>
          <span className="page-info">Page {page} / {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="btn btn-secondary"
          >
            Suivant →
          </button>
        </div>
      )}

      {/* Modal Création */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content modal-nouveau-courrier" onClick={e => e.stopPropagation()}>
            <div className="modal-nc-header modal-nc-header-compact">
              <span className="modal-nc-icone">📬</span>
              <h2 className="modal-nc-title">Nouveau courrier</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="modal-nc-body modal-nc-body-ergonomique">
              <div className="modal-nc-doc modal-nc-doc-ergonomique">
                <label>Document joint <span className="modal-nc-doc-prec">(optionnel)</span></label>
                <div className="modal-nc-doc-row modal-nc-doc-row-ergonomique">
                  <span className="modal-nc-doc-choix">Choisir un fichier</span>
                  <label className="modal-nc-file-label">
                    <input type="file" accept=".pdf,image/*" onChange={handleFileChange} className="modal-nc-file-input" />
                    <span className="modal-nc-file-btn">Parcourir</span>
                  </label>
                  <span className="modal-nc-doc-ou">ou</span>
                  <button className="btn btn-outline-info modal-nc-scan-btn" type="button" onClick={handleScanJsForCourrier}>
                    <span role="img" aria-label="scanjs">📠</span> Scanner
                  </button>
                  {newCourrierFile && (
                    <div className="modal-nc-doc-file">
                      <span>📎 {newCourrierFile.name}</span>
                      <button className="btn btn-sm btn-danger" onClick={() => setNewCourrierFile(null)} type="button">Retirer</button>
                    </div>
                  )}
                </div>
                <small>PDF ou image, max 50 Mo</small>
              </div>
              <div className="modal-nc-row modal-nc-row-ergonomique">
                <div>
                  <label>Type *</label>
                  <select value={newCourrier.type} onChange={e => setNewCourrier({ ...newCourrier, type: e.target.value as TypeCourrier })}>
                    <option value="Entrant">📥 Entrant</option>
                    <option value="Sortant">📤 Sortant</option>
                  </select>
                </div>
                <div>
                  <label>Urgence *</label>
                  <select value={newCourrier.urgence} onChange={e => setNewCourrier({ ...newCourrier, urgence: e.target.value as UrgenceCourrier })}>
                    <option value="Normale">🟢 Normale</option>
                    <option value="Importante">🟡 Importante</option>
                    <option value="Urgente">🟠 Urgente</option>
                    <option value="TresUrgente">🔴 Très Urgente</option>
                  </select>
                </div>
              </div>
              <div>
                <label>Objet *</label>
                <input type="text" value={newCourrier.objet} onChange={e => setNewCourrier({ ...newCourrier, objet: e.target.value })} placeholder="Objet du courrier" />
              </div>
              <div className="modal-nc-row modal-nc-row-ergonomique">
                <div>
                  <label>Expéditeur *</label>
                  <input type="text" value={newCourrier.expediteur} onChange={e => setNewCourrier({ ...newCourrier, expediteur: e.target.value })} placeholder="Nom de l'expéditeur" />
                </div>
                <div>
                  <label>Destinataire *</label>
                  <input type="text" value={newCourrier.destinataire} onChange={e => setNewCourrier({ ...newCourrier, destinataire: e.target.value })} placeholder="Nom du destinataire" />
                </div>
              </div>
              <div className="modal-nc-row modal-nc-row-ergonomique">
                <div>
                  <label>Date du courrier *</label>
                  <input type="date" value={newCourrier.dateCourrier} onChange={e => setNewCourrier({ ...newCourrier, dateCourrier: e.target.value })} />
                </div>
                <div>
                  <label>Référence externe</label>
                  <input type="text" value={newCourrier.referenceExterne || ''} onChange={e => setNewCourrier({ ...newCourrier, referenceExterne: e.target.value })} placeholder="Réf. externe (optionnel)" />
                </div>
              </div>
              {workspaces.length > 0 && (
                <div>
                  <label>Workspace</label>
                  <select value={newCourrier.workspaceId || ''} onChange={e => setNewCourrier({ ...newCourrier, workspaceId: e.target.value || undefined })}>
                    <option value="">-- Sélectionner --</option>
                    {workspaces.map(ws => (
                      <option key={ws.id} value={ws.id}>{ws.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label>Notes</label>
                <textarea value={newCourrier.notes || ''} onChange={e => setNewCourrier({ ...newCourrier, notes: e.target.value })} placeholder="Notes supplémentaires..." rows={3} />
              </div>
            </div>
            <div className="modal-footer modal-nc-footer modal-nc-footer-align">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateCourrier}
                disabled={!newCourrier.objet || !newCourrier.expediteur || !newCourrier.destinataire}
              >
                Créer le courrier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal OCR */}
      {showOcrModal && (
        <div className="modal-overlay" onClick={() => setShowOcrModal(false)}>
          <div className="modal-content ocr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📷 Scanner & Analyser (OCR)</h2>
              <button className="close-btn" onClick={() => setShowOcrModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="ocr-dropzone">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setOcrFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                />
                {ocrFile ? (
                  <div className="file-preview">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{ocrFile.name}</span>
                    <button className="btn btn-icon" onClick={() => setOcrFile(null)}>✕</button>
                  </div>
                ) : (
                  <div className="dropzone-content" onClick={() => fileInputRef.current?.click()}>
                    <span className="dropzone-icon">📁</span>
                    <p>Cliquez pour sélectionner un fichier</p>
                    <span className="dropzone-hint">Images (JPG, PNG) ou PDF</span>
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={ocrData.type}
                    onChange={(e) => setOcrData({ ...ocrData, type: e.target.value as TypeCourrier })}
                  >
                    <option value="Entrant">📥 Entrant</option>
                    <option value="Sortant">📤 Sortant</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Urgence *</label>
                  <select
                    value={ocrData.urgence}
                    onChange={(e) => setOcrData({ ...ocrData, urgence: e.target.value as UrgenceCourrier })}
                  >
                    <option value="Normale">🟢 Normale</option>
                    <option value="Importante">🟡 Importante</option>
                    <option value="Urgente">🟠 Urgente</option>
                    <option value="TresUrgente">🔴 Très Urgente</option>
                  </select>
                </div>
              </div>
              {workspaces.length > 0 && (
                <div className="form-group">
                  <label>Workspace</label>
                  <select
                    value={ocrData.workspaceId || ''}
                    onChange={(e) => setOcrData({ ...ocrData, workspaceId: e.target.value || undefined })}
                  >
                    <option value="">-- Sélectionner --</option>
                    {workspaces.map(ws => (
                      <option key={ws.id} value={ws.id}>{ws.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={ocrData.notes || ''}
                  onChange={(e) => setOcrData({ ...ocrData, notes: e.target.value })}
                  placeholder="Notes supplémentaires..."
                  rows={2}
                />
              </div>
              <div className="ocr-info">
                <span className="info-icon">ℹ️</span>
                <p>L'OCR analysera automatiquement le document pour extraire l'expéditeur, le destinataire, l'objet, la date et la référence.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowOcrModal(false)}>
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={handleOcrReception}
                disabled={!ocrFile || ocrLoading}
              >
                {ocrLoading ? '⏳ Analyse en cours...' : '🔍 Analyser et créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détail */}
      {showDetailModal && selectedCourrier && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📬 {selectedCourrier.reference}</h2>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-section">
                  <h3>Informations générales</h3>
                  <div className="detail-row">
                    <span className="detail-label">Type:</span>
                    <span className={`type-badge ${(selectedCourrier.type || 'entrant').toLowerCase()}`}>
                      {TYPE_COURRIER_LABELS[selectedCourrier.type]}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Objet:</span>
                    <span className="detail-value">{selectedCourrier.objet}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Expéditeur:</span>
                    <span className="detail-value">{selectedCourrier.expediteur}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Destinataire:</span>
                    <span className="detail-value">{selectedCourrier.destinataire}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date du courrier:</span>
                    <span className="detail-value">{formatDate(selectedCourrier.dateCourrier)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date de réception:</span>
                    <span className="detail-value">{formatDateTime(selectedCourrier.dateReception)}</span>
                  </div>
                </div>
                <div className="detail-section">
                  <h3>Statut & Urgence</h3>
                  <div className="detail-row">
                    <span className="detail-label">Statut:</span>
                    <span
                      className="statut-badge"
                      style={{ backgroundColor: STATUT_COURRIER_COLORS[selectedCourrier.statut] }}
                    >
                      {STATUT_COURRIER_LABELS[selectedCourrier.statut]}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Urgence:</span>
                    <span
                      className="urgence-badge"
                      style={{ backgroundColor: URGENCE_COURRIER_COLORS[selectedCourrier.urgence] }}
                    >
                      {URGENCE_COURRIER_LABELS[selectedCourrier.urgence]}
                    </span>
                  </div>
                  {selectedCourrier.referenceExterne && (
                    <div className="detail-row">
                      <span className="detail-label">Réf. externe:</span>
                      <span className="detail-value">{selectedCourrier.referenceExterne}</span>
                    </div>
                  )}
                  {selectedCourrier.dossierReference && (
                    <div className="detail-row">
                      <span className="detail-label">Dossier lié:</span>
                      <span className="detail-value link">{selectedCourrier.dossierReference}</span>
                    </div>
                  )}
                  {selectedCourrier.assigneANom && (
                    <div className="detail-row">
                      <span className="detail-label">Assigné à:</span>
                      <span className="detail-value">{selectedCourrier.assigneANom}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Document */}
              {selectedCourrier.hasDocument && (
                <div className="detail-section document-section">
                  <h3>📎 Document joint</h3>
                  <div className="document-info">
                    <span className="doc-icon">📄</span>
                    <span className="doc-name">{selectedCourrier.nomFichier}</span>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleDownloadDocument(selectedCourrier.id, selectedCourrier.nomFichier || 'document')}
                    >
                      ⬇️ Télécharger
                    </button>
                  </div>
                  {selectedCourrier.confianceOCR && (
                    <div className="ocr-confidence">
                      <span>Confiance OCR:</span>
                      <div className="confidence-bar">
                        <div
                          className="confidence-fill"
                          style={{ width: `${selectedCourrier.confianceOCR}%` }}
                        />
                      </div>
                      <span>{selectedCourrier.confianceOCR}%</span>
                    </div>
                  )}
                </div>
              )}

              {/* OCR Text */}
              {selectedCourrier.texteOCR && (
                <div className="detail-section ocr-section">
                  <h3>📝 Texte OCR extrait</h3>
                  <div className="ocr-text">
                    {selectedCourrier.texteOCR}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedCourrier.notes && (
                <div className="detail-section">
                  <h3>📝 Notes</h3>
                  <p className="notes-text">{selectedCourrier.notes}</p>
                </div>
              )}

              {/* Historique */}
              {selectedCourrier.historiques && selectedCourrier.historiques.length > 0 && (
                <div className="detail-section history-section">
                  <h3>📜 Historique</h3>
                  <div className="history-timeline">
                    {selectedCourrier.historiques.map((h, idx) => (
                      <div key={h.id} className="history-item">
                        <div className="history-dot" />
                        <div className="history-content">
                          <span className="history-action">{h.action}</span>
                          {h.details && <span className="history-details">{h.details}</span>}
                          <span className="history-meta">
                            Par {h.userNom} - {formatDateTime(h.dateAction)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions de changement de statut */}
              <div className="detail-section actions-section">
                <h3>⚡ Actions rapides</h3>
                <div className="action-buttons">
                  {selectedCourrier.statut === 'Recu' && (
                    <button
                      className="btn btn-warning"
                      onClick={() => handleChangerStatut(selectedCourrier.id, 'EnTraitement')}
                    >
                      ⚙️ Mettre en traitement
                    </button>
                  )}
                  {selectedCourrier.statut === 'EnTraitement' && (
                    <button
                      className="btn btn-success"
                      onClick={() => handleChangerStatut(selectedCourrier.id, 'Traite')}
                    >
                      ✅ Marquer traité
                    </button>
                  )}
                  {selectedCourrier.statut !== 'Archive' && selectedCourrier.statut !== 'Rejete' && (
                    <>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleChangerStatut(selectedCourrier.id, 'Archive')}
                      >
                        📦 Archiver
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleChangerStatut(selectedCourrier.id, 'Rejete')}
                      >
                        ❌ Rejeter
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
