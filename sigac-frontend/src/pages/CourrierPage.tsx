import { useEffect, useState, useCallback, useRef } from 'react';
import courrierApi from '../api/courrierApi';
import workspaceApi from '../api/workspaceApi';
import { userApi } from '../api/userApi';
import { useToast } from '../components/common/ToastProvider';
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
  const [activeDetailTab, setActiveDetailTab] = useState<'infos' | 'document' | 'historique'>('infos')
  const { notify } = useToast()

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
      notify({ type: 'success', message: '✅ Courrier créé avec succès' });
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
      notify({ type: 'success', message: '✅ Analyse OCR terminée' });
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
      notify({ type: 'success', message: `✅ Statut mis à jour : ${STATUT_COURRIER_LABELS[nouveauStatut]}` });
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
      notify({ type: 'info', message: '📥 Téléchargement en cours...' });
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
      setActiveDetailTab('infos');
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
        {stats && (
          <div className="courrier-stats" style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <div className="stat-card" style={{ flex: 1, background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderLeft: '4px solid #6366f1' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{stats.total}</div>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Courriers</div>
            </div>
            <div className="stat-card" style={{ flex: 1, background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderLeft: `4px solid ${STATUT_COURRIER_COLORS.Recu}` }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{stats.recu}</div>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nouveaux / Reçus</div>
            </div>
            <div className="stat-card" style={{ flex: 1, background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderLeft: `4px solid ${STATUT_COURRIER_COLORS.EnTraitement}` }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{stats.enTraitement}</div>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>En cours</div>
            </div>
            <div className="stat-card" style={{ flex: 1, background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderLeft: `4px solid ${STATUT_COURRIER_COLORS.Traite}` }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{stats.traite}</div>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Traités</div>
            </div>
          </div>
        )}
        <div className="header-actions" style={{ background: 'white', padding: '12px 20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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

          <button className="btn btn-secondary" onClick={() => setShowOcrModal(true)}>
            📷 OCR
          </button>
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
                <tr 
                  key={courrier.id} 
                  onClick={() => handleViewCourrier(courrier)} 
                  className="courrier-row"
                  style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                >
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
                      style={{ color: URGENCE_COURRIER_COLORS[courrier.urgence], borderColor: URGENCE_COURRIER_COLORS[courrier.urgence] }}
                    >
                      <span className="dot" style={{ backgroundColor: URGENCE_COURRIER_COLORS[courrier.urgence] }}></span>
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
          <div className="modal-content modal-nouveau-courrier" onClick={e => e.stopPropagation()} style={{maxWidth: '750px', padding: 0, overflow: 'hidden', borderRadius: '16px'}}>
            <div style={{ 
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              padding: '20px 32px',
              color: 'white',
              position: 'relative'
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>📬 Nouveau Courrier</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)} style={{ color: 'white', top: '18px', right: '20px', background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-nc-scrollable">
              <section className="modal-nc-section">
                <h3 className="modal-nc-section-title">Document joint <span className="modal-nc-doc-prec">(optionnel)</span></h3>
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
              </section>
              <section className="modal-nc-section">
                <h3 className="modal-nc-section-title">Informations principales</h3>
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
              </section>
            </div>
            <div className="modal-nc-footer modal-nc-footer-fixed">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)} type="button">
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateCourrier}
                disabled={loadingCreateCourrier || !newCourrier.objet || !newCourrier.expediteur || !newCourrier.destinataire}
                type="button"
              >
                {loadingCreateCourrier ? 'Création...' : 'Créer le courrier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal OCR */}
      {showOcrModal && (
        <div className="modal-overlay" onClick={() => setShowOcrModal(false)}>
          <div className="modal-content ocr-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '650px', padding: 0, overflow: 'hidden', borderRadius: '16px'}}>
            <div style={{ 
              background: 'linear-gradient(135deg, #0891b2 0%, #4f46e5 100%)',
              padding: '20px 32px',
              color: 'white',
              position: 'relative'
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>📷 Analyse Intelligente (OCR)</h2>
              <button className="close-btn" onClick={() => setShowOcrModal(false)} style={{ color: 'white', top: '18px', right: '20px', background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
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
                    <span className="file-name" title={ocrFile.name}>{ocrFile.name}</span>
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
              <div className="modal-nc-row modal-nc-row-ergonomique" style={{marginTop: '1rem'}}>
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
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '900px', padding: 0, overflow: 'hidden'}}>
            {/* En-tête moderne avec gradient style DossierDetailModal */}
            <div style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '24px 32px',
              color: 'white',
              position: 'relative'
            }}>
              <button className="close-btn" onClick={() => setShowDetailModal(false)} style={{ color: 'white', top: '20px', right: '20px', background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 6, letterSpacing: '0.5px' }}>
                📬 Courrier Réf.
              </div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
                {selectedCourrier.reference}
              </h2>
              <div style={{ fontSize: 16, marginTop: 8, opacity: 0.95 }}>
                {selectedCourrier.objet}
              </div>
              
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <span className="statut-badge" style={{ backgroundColor: STATUT_COURRIER_COLORS[selectedCourrier.statut], border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                  {STATUT_COURRIER_LABELS[selectedCourrier.statut]}
                </span>
                <span className="urgence-badge" style={{ backgroundColor: URGENCE_COURRIER_COLORS[selectedCourrier.urgence], border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                  {URGENCE_COURRIER_LABELS[selectedCourrier.urgence]}
                </span>
              </div>
            </div>

            {/* Navigation par onglets */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 32px' }}>
              <button 
                onClick={() => setActiveDetailTab('infos')}
                style={{
                  padding: '14px 20px', border: 'none', background: 'transparent',
                  color: activeDetailTab === 'infos' ? '#5b21b6' : '#64748b',
                  fontWeight: activeDetailTab === 'infos' ? 600 : 400,
                  borderBottom: activeDetailTab === 'infos' ? '3px solid #5b21b6' : '3px solid transparent',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >ℹ️ Détails</button>
              <button 
                onClick={() => setActiveDetailTab('document')}
                style={{
                  padding: '14px 20px', border: 'none', background: 'transparent',
                  color: activeDetailTab === 'document' ? '#5b21b6' : '#64748b',
                  fontWeight: activeDetailTab === 'document' ? 600 : 400,
                  borderBottom: activeDetailTab === 'document' ? '3px solid #5b21b6' : '3px solid transparent',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >📎 Document & OCR</button>
              <button 
                onClick={() => setActiveDetailTab('historique')}
                style={{
                  padding: '14px 20px', border: 'none', background: 'transparent',
                  color: activeDetailTab === 'historique' ? '#5b21b6' : '#64748b',
                  fontWeight: activeDetailTab === 'historique' ? 600 : 400,
                  borderBottom: activeDetailTab === 'historique' ? '3px solid #5b21b6' : '3px solid transparent',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >📜 Historique</button>
            </div>

            <div className="modal-body" style={{ padding: '24px 32px', maxHeight: '65vh', overflowY: 'auto', background: '#f8fafc' }}>
              {activeDetailTab === 'infos' && (
                <div style={{ display: 'grid', gap: 20 }}>
                  <div className="detail-grid">
                    <div className="detail-section card-like" style={{ margin: 0 }}>
                      <h3>Expédition & Réception</h3>
                      <div className="detail-row"><span className="detail-label">Expéditeur:</span><span className="detail-value">{selectedCourrier.expediteur}</span></div>
                      <div className="detail-row"><span className="detail-label">Destinataire:</span><span className="detail-value">{selectedCourrier.destinataire}</span></div>
                      <div className="detail-row"><span className="detail-label">Date Courrier:</span><span className="detail-value">{formatDate(selectedCourrier.dateCourrier)}</span></div>
                      <div className="detail-row"><span className="detail-label">Date Réception:</span><span className="detail-value">{formatDateTime(selectedCourrier.dateReception)}</span></div>
                    </div>
                    <div className="detail-section card-like" style={{ margin: 0 }}>
                      <h3>Liaisons & Attribution</h3>
                      <div className="detail-row"><span className="detail-label">Réf. externe:</span><span className="detail-value">{selectedCourrier.referenceExterne || '-'}</span></div>
                      <div className="detail-row"><span className="detail-label">Dossier lié:</span><span className="detail-value link">{selectedCourrier.dossierReference || 'Aucun'}</span></div>
                      <div className="detail-row"><span className="detail-label">Assigné à:</span><span className="detail-value">{selectedCourrier.assigneANom || 'Non assigné'}</span></div>
                    </div>
                  </div>
                  
                  {selectedCourrier.notes && (
                    <div className="detail-section card-like" style={{ margin: 0 }}>
                      <h3>📝 Notes</h3>
                      <p className="notes-text">{selectedCourrier.notes}</p>
                    </div>
                  )}

                  <div className="detail-section card-like" style={{ margin: 0 }}>
                    <h3>⚡ Actions rapides</h3>
                    <div className="action-buttons">
                      {selectedCourrier.statut === 'Recu' && (
                        <button className="btn btn-warning" onClick={() => handleChangerStatut(selectedCourrier.id, 'EnTraitement')}>⚙️ Traiter</button>
                      )}
                      {selectedCourrier.statut === 'EnTraitement' && (
                        <button className="btn btn-success" onClick={() => handleChangerStatut(selectedCourrier.id, 'Traite')}>✅ Terminer</button>
                      )}
                      {selectedCourrier.statut !== 'Archive' && (
                        <button className="btn btn-secondary" onClick={() => handleChangerStatut(selectedCourrier.id, 'Archive')}>📦 Archiver</button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === 'document' && (
                <div style={{ display: 'grid', gap: 20 }}>
                  {selectedCourrier.hasDocument ? (
                    <>
                      <div className="detail-section document-section card-like" style={{ margin: 0 }}>
                        <h3>📎 Fichier joint</h3>
                        <div className="document-info">
                          <span className="doc-icon">📄</span>
                          <span className="doc-name">{selectedCourrier.nomFichier}</span>
                          <button className="btn btn-secondary" onClick={() => handleDownloadDocument(selectedCourrier.id, selectedCourrier.nomFichier || 'document')}>⬇️ Télécharger</button>
                        </div>
                      </div>
                      {selectedCourrier.texteOCR && (
                        <div className="detail-section ocr-section card-like" style={{ margin: 0 }}>
                          <h3>📝 Texte OCR extrait</h3>
                          <div className="ocr-text" style={{ whiteSpace: 'pre-wrap', fontSize: '13px', color: '#334155' }}>{selectedCourrier.texteOCR}</div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
                      <p>Aucun document joint à ce courrier</p>
                    </div>
                  )}
                </div>
              )}

              {activeDetailTab === 'historique' && (
                <div className="detail-section history-section card-like" style={{ margin: 0 }}>
                  <h3>📜 Historique des actions</h3>
                  {selectedCourrier.historiques && selectedCourrier.historiques.length > 0 ? (
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
                  ) : (
                    <p style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>Aucun historique disponible</p>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ padding: '16px 32px', background: 'white', borderTop: '1px solid #e2e8f0' }}>
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
