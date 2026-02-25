import { useEffect, useState, useCallback, useRef } from 'react';
import { Mail, Inbox, Send, AlertCircle, CheckCircle2, RotateCw, Trash2, Paperclip, Eye, Clock, MailOpen, Zap, Filter, Download, Plus, RefreshCw, FileUp, X, Scan, User, Calendar, Link2, FolderOpen, Archive, Settings, FileText, History, ExternalLink, Play, ChevronRight } from 'lucide-react';
import courrierApi from '../api/courrierApi';
import workspaceApi from '../api/workspaceApi';
import { userApi } from '../api/userApi';
import { useToast } from '../components/common/ToastProvider';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useWorkspaceStore } from '../store/workspaceStore';
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
  Entrant: 'Entrant',
  Sortant: 'Sortant'
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

  // Workspace global store
  const { currentWorkspace } = useWorkspaceStore()

  // Filtres
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<TypeCourrier | ''>('')
  const [filterStatut, setFilterStatut] = useState<StatutCourrier | ''>('')
  const [filterUrgence, setFilterUrgence] = useState<UrgenceCourrier | ''>('')
  const [filterWorkspace, setFilterWorkspace] = useState(currentWorkspace?.id || '')

  // Synchroniser filterWorkspace avec le store global
  useEffect(() => {
    setFilterWorkspace(currentWorkspace?.id || '')
    setPage(1)
    // Mettre à jour les formulaires avec le workspace sélectionné
    setNewCourrier(prev => ({ ...prev, workspaceId: currentWorkspace?.id || undefined }))
    setOcrData(prev => ({ ...prev, workspaceId: currentWorkspace?.id || undefined }))
  }, [currentWorkspace])

  // Données référentielles
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([])
  const [users, setUsers] = useState<UserDto[]>([])
  const [stats, setStats] = useState<CourrierStatsDto | null>(null)

  // Sélection multiple (Bulk actions)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [bulkAction, setBulkAction] = useState<'statut' | 'urgence' | 'delete' | null>(null)
  const [bulkActionValue, setBulkActionValue] = useState<string>('')

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
  const [ocrData, setOcrData] = useState<ReceptionCourrierOcrDto>(() => ({
    type: 'Entrant',
    urgence: 'Normale',
    workspaceId: undefined
  }))
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
        const ws = await workspaceApi.getUserWorkspaces();
        setWorkspaces(ws);
      } catch (e) { /* ignore */ }
    };
    const loadUsers = async () => {
      try {
        const us = await userApi.list(1, 1000);
        setUsers(us.data);
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
      if (newCourrierFile) {
        // Avec fichier → utiliser reception-ocr endpoint
        await courrierApi.receptionnerAvecOcr(newCourrierFile, {
          type: newCourrier.type as TypeCourrier,
          urgence: newCourrier.urgence as UrgenceCourrier,
          notes: newCourrier.objet || undefined,
          workspaceId: filterWorkspace || undefined,
          assigneAId: undefined
        });
      } else {
        // Sans fichier → créer avec JSON
        await courrierApi.create({
          type: newCourrier.type as TypeCourrier,
          objet: newCourrier.objet,
          expediteur: newCourrier.expediteur,
          destinataire: newCourrier.destinataire,
          dateCourrier: newCourrier.dateCourrier,
          urgence: newCourrier.urgence as UrgenceCourrier,
          workspaceId: filterWorkspace || undefined
        });
      }
      setShowCreateModal(false);
      setNewCourrierFile(null);
      setNewCourrier({
        type: 'Entrant',
        objet: '',
        expediteur: '',
        destinataire: '',
        dateCourrier: new Date().toISOString().split('T')[0],
        urgence: 'Normale',
        workspaceId: filterWorkspace || undefined
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
      setOcrData({ type: 'Entrant', urgence: 'Normale', workspaceId: filterWorkspace || undefined });
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
      setSelectedCourrier(courrier as unknown as CourrierDetailDto);
      setActiveDetailTab('infos');
      setShowDetailModal(true);
    } catch (e) {
      console.error(e);
    }
  }

  // Gestion sélection multiple
  const handleSelectCourrier = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === courriers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(courriers.map(c => c.id)));
    }
  };

  // Bulk actions
  const handleBulkStatutChange = async (newStatut: StatutCourrier) => {
    try {
      let completed = 0;
      for (const id of Array.from(selectedIds)) {
        try {
          await courrierApi.changerStatut(id, newStatut);
          completed++;
        } catch (e) { /* skip */ }
      }
      notify({ type: 'success', message: `✅ ${completed} courrier(s) mis à jour` });
      setSelectedIds(new Set());
      loadCourriers();
      loadStats();
    } catch (e) {
      notify({ type: 'error', message: 'Erreur lors de la mise à jour' });
    }
  };

  return (
    <div className="courrier-page" style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header avec statistiques */}
      <div className="courrier-header" style={{ marginBottom: '40px' }}>
        <div className="header-title" style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1e293b', letterSpacing: '-1px', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Mail size={32} style={{ color: '#3b82f6' }} /> Gestion du Courrier
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '8px' }}>
            Consultez et gérez l'ensemble des flux documentaires de votre organisation.
          </p>
        </div>
        {stats && (
          <div className="courrier-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {/* Stat: Total */}
            <div className="stat-card stat-total" style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</span>
                <Mail size={20} style={{ color: '#3b82f6' }} />
              </div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: '#1e293b' }}>{stats.totalCourriers}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>tous les courriers</div>
            </div>

            {/* Stat: À traiter */}
            <div className="stat-card stat-warning" style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', borderLeft: `4px solid #f59e0b`, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>À traiter</span>
                <Zap size={20} style={{ color: '#f59e0b' }} />
              </div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: '#1e293b' }}>{(stats.enAttente || 0) + (stats.enTraitement || 0)}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>nouveaux + en cours</div>
            </div>

            {/* Stat: Urgents */}
            <div className="stat-card stat-urgent" style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', borderLeft: `4px solid #ef4444`, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Urgents</span>
                <AlertCircle size={20} style={{ color: '#ef4444' }} />
              </div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: '#1e293b' }}>{stats.urgents || 0}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>marqés urgents</div>
            </div>

            {/* Stat: Traités */}
            <div className="stat-card stat-success" style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', borderLeft: `4px solid #10b981`, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Traités</span>
                <CheckCircle2 size={20} style={{ color: '#10b981' }} />
              </div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: '#1e293b' }}>{stats.traites || 0}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>processus terminés</div>
            </div>
          </div>
        )}

        {/* Quick Filters */}
        <div className="quick-filters" style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              if (filterStatut === 'Recu' && filterUrgence === '') {
                setFilterStatut('');
              } else {
                setFilterStatut('Recu');
                setFilterUrgence('');
              }
              setPage(1);
            }}
            style={{
              padding: '10px 16px',
              borderRadius: '20px',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: filterStatut === 'Recu' ? '#3b82f6' : '#f1f5f9',
              color: filterStatut === 'Recu' ? 'white' : '#64748b',
              boxShadow: filterStatut === 'Recu' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Mail size={16} /> Nouveaux
          </button>

          <button
            onClick={() => {
              const toTrait = filterStatut === 'EnTraitement' ? '' : 'EnTraitement';
              setFilterStatut(toTrait);
              setPage(1);
            }}
            style={{
              padding: '10px 16px',
              borderRadius: '20px',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: filterStatut === 'EnTraitement' ? '#f59e0b' : '#f1f5f9',
              color: filterStatut === 'EnTraitement' ? 'white' : '#64748b',
              boxShadow: filterStatut === 'EnTraitement' ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCw size={16} /> En cours
          </button>

          <button
            onClick={() => {
              const urgents = filterUrgence === 'TresUrgente' ? '' : 'TresUrgente';
              setFilterUrgence(urgents);
              setPage(1);
            }}
            style={{
              padding: '10px 16px',
              borderRadius: '20px',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: filterUrgence === 'TresUrgente' ? '#ef4444' : '#f1f5f9',
              color: filterUrgence === 'TresUrgente' ? 'white' : '#64748b',
              boxShadow: filterUrgence === 'TresUrgente' ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <AlertCircle size={16} /> Urgents
          </button>

          <button
            onClick={() => {
              const archived = filterStatut === 'Archive' ? '' : 'Archive';
              setFilterStatut(archived);
              setPage(1);
            }}
            style={{
              padding: '10px 16px',
              borderRadius: '20px',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: filterStatut === 'Archive' ? '#6b7280' : '#f1f5f9',
              color: filterStatut === 'Archive' ? 'white' : '#64748b',
              boxShadow: filterStatut === 'Archive' ? '0 4px 12px rgba(107, 114, 128, 0.3)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Mail size={16} /> Archivés
          </button>

          {(filterStatut !== '' || filterUrgence !== '') && (
            <button
              onClick={() => {
                setFilterStatut('');
                setFilterUrgence('');
                setPage(1);
              }}
              style={{
                padding: '10px 16px',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: 'white',
                color: '#64748b',
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Filter size={16} /> Réinitialiser
            </button>
          )}
        </div>

        <div className="header-actions" style={{ background: 'white', padding: '16px 24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', border: '1px solid #e2e8f0' }}>
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

          <button className="btn btn-secondary" onClick={() => loadCourriers()} title="Rafraîchir" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RotateCw size={18} />
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} style={{ padding: '10px 24px', fontWeight: 600, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', border: 'none', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} /> Nouveau
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="error-banner" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
          <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} /> {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontSize: '20px', padding: '0', lineHeight: '1' }}>×</button>
        </div>
      )}

      {/* Liste des courriers */}
      <div className="courrier-list">
        {loading ? (
          <div className="loading-state" style={{ padding: '60px 20px', background: 'white', borderRadius: '16px' }}>
            <LoadingSpinner message="Chargement des courriers..." />
          </div>
        ) : courriers.length === 0 && !loading ? (
          <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center', background: 'white', borderRadius: '16px', border: '2px dashed #e2e8f0', marginTop: '20px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <MailOpen size={48} style={{ color: '#cbd5e1' }} />
            </div>
            <h3 style={{ color: '#1e293b', marginBottom: '8px', fontSize: '18px', fontWeight: 600 }}>Aucun courrier trouvé</h3>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Commencez par ajouter un nouveau courrier ou ajustez vos filtres.</p>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} style={{ padding: '12px 24px' }}>
              Créer un premier courrier
            </button>
          </div>
        ) : (
          <>
            {/* Barre d'actions bulk */}
            {selectedIds.size > 0 && (
              <div style={{ background: '#e0f2fe', border: '1px solid #0ea5e9', padding: '16px 24px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: '#0c4a6e' }}>
                  {selectedIds.size} courrier(s) sélectionné(s)
                </span>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => setBulkAction('statut')}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RotateCw size={14} /> Changer statut
                  </button>
                  <button 
                    onClick={() => setBulkAction('urgence')}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#8b5cf6', color: 'white', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Zap size={14} /> Urgence
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm('Êtes-vous sûr de vouloir supprimer ces courriers?')) {
                        // TODO: Impl delete bulk
                      }
                    }}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Trash2 size={14} /> Supprimer
                  </button>
                </div>
              </div>
            )}

            {/* Modal choix statut bulk */}
            {bulkAction === 'statut' && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setBulkAction(null)}>
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', minWidth: '300px' }} onClick={(e) => e.stopPropagation()}>
                  <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Nouveau statut</h3>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {(['Recu', 'EnTraitement', 'Traite', 'Archive'] as StatutCourrier[]).map(statut => (
                      <button
                        key={statut}
                        onClick={() => {
                          handleBulkStatutChange(statut);
                          setBulkAction(null);
                        }}
                        style={{ padding: '12px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
                      >
                        {STATUT_COURRIER_LABELS[statut]}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setBulkAction(null)} style={{ marginTop: '16px', width: '100%', padding: '10px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', cursor: 'pointer' }}>
                    Annuler
                  </button>
                </div>
              </div>
            )}

            <table className="courrier-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                  <th style={{ width: '40px', textAlign: 'center', padding: '14px 8px', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.size === courriers.length && courriers.length > 0}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Référence</th>
                  <th style={{ textAlign: 'center', padding: '14px 8px', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Objet</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expéditeur</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Destinataire</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Statut</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Urgence</th>
                </tr>
              </thead>
              <tbody>
                {courriers.map(courrier => (
                  <tr 
                    key={courrier.id} 
                    className="courrier-row"
                    style={{ 
                      cursor: 'pointer', 
                      transition: 'all 0.2s ease-in-out', 
                      backgroundColor: selectedIds.has(courrier.id) ? '#eff6ff' : 'white',
                      boxShadow: selectedIds.has(courrier.id) 
                        ? '0 0 0 2px #3b82f6, 0 4px 12px rgba(59, 130, 246, 0.15)' 
                        : '0 2px 8px rgba(0,0,0,0.04)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      borderColor: selectedIds.has(courrier.id) ? '#3b82f6' : '#e2e8f0'
                    }}
                    onMouseEnter={(e) => !selectedIds.has(courrier.id) && (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                    onMouseLeave={(e) => !selectedIds.has(courrier.id) && (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)')}
                  >
                    <td style={{ padding: '16px 8px', width: '40px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(courrier.id)}
                        onChange={() => handleSelectCourrier(courrier.id)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </td>
                    <td onClick={() => handleViewCourrier(courrier)} style={{ padding: '16px 12px', borderRadius: '12px 0 0 12px', fontWeight: 700, color: '#4f46e5', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {courrier.reference}
                      {courrier.hasDocument && <span title="Document joint"><Paperclip size={14} style={{ color: '#f59e0b' }} /></span>}
                    </td>
                    <td onClick={() => handleViewCourrier(courrier)} style={{ padding: '16px 8px', textAlign: 'center' }}>
                      {courrier.type === 'Entrant' ? <Inbox size={18} style={{ color: '#3b82f6' }} /> : <Send size={18} style={{ color: '#8b5cf6' }} />}
                    </td>
                    <td onClick={() => handleViewCourrier(courrier)} style={{ padding: '16px 12px', fontWeight: 500, color: '#1e293b', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={courrier.objet}>
                      {courrier.objet}
                    </td>
                    <td onClick={() => handleViewCourrier(courrier)} style={{ padding: '16px 12px', color: '#475569', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={courrier.expediteur}>
                      {courrier.expediteur && courrier.expediteur !== 'À déterminer' ? courrier.expediteur : '-'}
                    </td>
                    <td onClick={() => handleViewCourrier(courrier)} style={{ padding: '16px 12px', color: '#475569', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={courrier.destinataire}>
                      {courrier.destinataire && courrier.destinataire !== 'À déterminer' ? courrier.destinataire : '-'}
                    </td>
                    <td onClick={() => handleViewCourrier(courrier)} style={{ padding: '16px 12px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'center' }}>{formatDate(courrier.dateCourrier)}</td>
                    <td onClick={() => handleViewCourrier(courrier)} style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <span
                        style={{ 
                          backgroundColor: STATUT_COURRIER_COLORS[courrier.statut], 
                          color: 'white', 
                          padding: '6px 12px', 
                          borderRadius: '20px', 
                          fontSize: '11px', 
                          fontWeight: 700,
                          display: 'inline-block',
                          minWidth: '85px'
                        }}
                      >
                        {STATUT_COURRIER_LABELS[courrier.statut]}
                      </span>
                    </td>
                    <td onClick={() => handleViewCourrier(courrier)} style={{ padding: '16px 12px', textAlign: 'center', borderRadius: '0 12px 12px 0' }}>
                      <span
                        style={{ 
                          color: URGENCE_COURRIER_COLORS[courrier.urgence], 
                          borderColor: URGENCE_COURRIER_COLORS[courrier.urgence], 
                          border: '2px solid', 
                          padding: '5px 10px', 
                          borderRadius: '20px', 
                          fontSize: '11px', 
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: URGENCE_COURRIER_COLORS[courrier.urgence], display: 'inline-block' }}></span>
                        {URGENCE_COURRIER_LABELS[courrier.urgence]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="btn btn-secondary"
          >
            ← Précédent
          </button>
          <span className="page-info" style={{ fontWeight: 600, color: '#64748b' }}>Page {page} sur {totalPages}</span>
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
          <div className="modal-content modal-nouveau-courrier" onClick={e => e.stopPropagation()} style={{maxWidth: '900px', padding: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'}}>
            {/* Header */}
            <div style={{ 
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              padding: '32px',
              color: 'white',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <Mail size={32} />
                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>Nouveau Courrier</h2>
              </div>
              <p style={{ margin: '8px 0 0 44px', color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>Enregistrez un nouveau courrier entrant ou sortant</p>
              <button className="close-btn" onClick={() => setShowCreateModal(false)} style={{ color: 'white', top: '20px', right: '24px', background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                <X size={24} />
              </button>
            </div>

            {/* Body scrollable */}
            <div className="modal-nc-scrollable" style={{ padding: '32px', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', background: '#fff' }}>
              {/* Section Document */}
              <section style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <FileUp size={20} style={{ color: '#4f46e5' }} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Document Joint</h3>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>(optionnel)</span>
                </div>
                <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: '#4f46e5', flex: 1, minWidth: '150px' }}>
                    <FileUp size={18} />
                    <span>Choisir un fichier</span>
                    <input type="file" accept=".pdf,image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                  </label>
                  <div style={{ color: '#94a3b8', fontWeight: 600 }}>ou</div>
                  <button className="btn btn-outline-info" type="button" onClick={handleScanJsForCourrier} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                    <Scan size={18} /> Scanner
                  </button>
                  {newCourrierFile && (
                    <div style={{ marginTop: '12px', width: '100%', background: '#e0e7ff', border: '1px solid #c7d2fe', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', fontWeight: 600 }}>
                        <Paperclip size={16} /> {newCourrierFile.name}
                      </span>
                      <button className="btn btn-sm" onClick={() => setNewCourrierFile(null)} type="button" style={{ background: '#fecaca', color: '#991b1b', border: 'none', fontWeight: 600 }}>Retirer</button>
                    </div>
                  )}
                </div>
                <small style={{ color: '#64748b', fontSize: '13px', marginTop: '8px', display: 'block' }}>PDF ou image, max 50 Mo</small>
              </section>

              {/* Section Type et Urgence */}
              <section style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <Inbox size={20} style={{ color: '#3b82f6' }} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Classification</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#334155', marginBottom: '8px' }}>
                      Type <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select value={newCourrier.type} onChange={e => setNewCourrier({ ...newCourrier, type: e.target.value as TypeCourrier })} style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600, background: '#fff', cursor: 'pointer'
                    }}>
                      <option value="Entrant">📥 Entrant</option>
                      <option value="Sortant">📤 Sortant</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#334155', marginBottom: '8px' }}>
                      Urgence <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select value={newCourrier.urgence} onChange={e => setNewCourrier({ ...newCourrier, urgence: e.target.value as UrgenceCourrier })} style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600, background: '#fff', cursor: 'pointer'
                    }}>
                      <option value="Normale">🟢 Normale</option>
                      <option value="Importante">🟡 Importante</option>
                      <option value="Urgente">🟠 Urgente</option>
                      <option value="TresUrgente">🔴 Très Urgente</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Section Contenu */}
              <section style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <MailOpen size={20} style={{ color: '#8b5cf6' }} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Contenu du Courrier</h3>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#334155', marginBottom: '8px' }}>
                    Objet <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input type="text" value={newCourrier.objet} onChange={e => setNewCourrier({ ...newCourrier, objet: e.target.value })} placeholder="Sujet/Objet du courrier" style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box'
                  }} />
                </div>
              </section>

              {/* Section Correspondants */}
              <section style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <Send size={20} style={{ color: '#06b6d4' }} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Correspondants</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#334155', marginBottom: '8px' }}>
                      Expéditeur <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input type="text" value={newCourrier.expediteur} onChange={e => setNewCourrier({ ...newCourrier, expediteur: e.target.value })} placeholder="Nom de l'expéditeur" style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box'
                    }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#334155', marginBottom: '8px' }}>
                      Destinataire <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input type="text" value={newCourrier.destinataire} onChange={e => setNewCourrier({ ...newCourrier, destinataire: e.target.value })} placeholder="Nom du destinataire" style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box'
                    }} />
                  </div>
                </div>
              </section>

              {/* Section Dates et Références */}
              <section style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <Clock size={20} style={{ color: '#f59e0b' }} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Dates et Références</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#334155', marginBottom: '8px' }}>
                      Date du courrier <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input type="date" value={newCourrier.dateCourrier} onChange={e => setNewCourrier({ ...newCourrier, dateCourrier: e.target.value })} style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box'
                    }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#334155', marginBottom: '8px' }}>Référence externe</label>
                    <input type="text" value={newCourrier.referenceExterne || ''} onChange={e => setNewCourrier({ ...newCourrier, referenceExterne: e.target.value })} placeholder="Réf. externe (optionnel)" style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box'
                    }} />
                  </div>
                </div>
              </section>

              {/* Section Workspace et Notes */}
              {workspaces.length > 0 && (
                <section style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#334155', marginBottom: '8px' }}>Workspace</label>
                  <select value={newCourrier.workspaceId || ''} onChange={e => setNewCourrier({ ...newCourrier, workspaceId: e.target.value || undefined })} style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600, background: '#fff', cursor: 'pointer', boxSizing: 'border-box'
                  }}>
                    <option value="">-- Sélectionner --</option>
                    {workspaces.map(ws => (
                      <option key={ws.id} value={ws.id}>{ws.name}</option>
                    ))}
                  </select>
                </section>
              )}

              <section>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#334155', marginBottom: '8px' }}>Notes</label>
                <textarea value={newCourrier.notes || ''} onChange={e => setNewCourrier({ ...newCourrier, notes: e.target.value })} placeholder="Notes supplémentaires..." rows={3} style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical'
                }} />
              </section>
            </div>

            {/* Footer */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'stretch',
              gap: '16px', 
              padding: '24px 32px', 
              background: '#f8fafc', 
              borderTop: '1px solid #e2e8f0',
              maxWidth: '400px',
              margin: '0 auto'
            }}>
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)} type="button" style={{ 
                flex: 1,
                fontWeight: 700, 
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f1f5f9',
                color: '#334155',
                height: '44px',
                minHeight: '44px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                margin: 0
              }}>
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateCourrier}
                disabled={loadingCreateCourrier || !newCourrier.objet || !newCourrier.expediteur || !newCourrier.destinataire}
                type="button"
                style={{ 
                  flex: 1,
                  background: loadingCreateCourrier || !newCourrier.objet || !newCourrier.expediteur || !newCourrier.destinataire 
                    ? '#cbd5e1' 
                    : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'center',
                  padding: '0 24px',
                  fontSize: '14px',
                  height: '44px',
                  minHeight: '44px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  margin: 0
                }}
              >
                {loadingCreateCourrier ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> Création...
                  </>
                ) : (
                  <>
                    <Plus size={18} /> Créer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal OCR */}
      {showOcrModal && (
        <div className="modal-overlay" onClick={() => setShowOcrModal(false)}>
          <div className="modal-content ocr-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '700px', padding: 0, overflow: 'hidden', borderRadius: '24px'}}>
            <div style={{ 
              background: 'linear-gradient(135deg, #0891b2 0%, #4f46e5 100%)',
              padding: '24px 32px',
              color: 'white',
              position: 'relative'
            }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>📷 Analyse Intelligente (OCR)</h2>
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
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '950px', padding: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'}}>
            {/* En-tête moderne avec gradient et motif */}
            <div style={{ 
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
              padding: '28px 32px',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Motif décoratif */}
              <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', bottom: -30, left: '30%', width: 100, height: 100, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
              
              <button 
                onClick={() => setShowDetailModal(false)} 
                style={{ 
                  position: 'absolute', top: 20, right: 20, 
                  background: 'rgba(255,255,255,0.15)', 
                  border: 'none', borderRadius: '10px', 
                  padding: '8px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              >
                <X size={18} color="white" />
              </button>
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Mail size={16} style={{ opacity: 0.9 }} />
                  <span style={{ fontSize: 13, opacity: 0.9, letterSpacing: '0.5px', fontWeight: 500 }}>Courrier</span>
                </div>
                <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>
                  {selectedCourrier.reference}
                </h2>
                <div style={{ fontSize: 16, marginTop: 8, opacity: 0.95, maxWidth: '85%' }}>
                  {selectedCourrier.objet}
                </div>
                
                <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                  <span style={{ 
                    backgroundColor: STATUT_COURRIER_COLORS[selectedCourrier.statut], 
                    backdropFilter: 'blur(10px)',
                    color: 'white', 
                    padding: '6px 14px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    <CheckCircle2 size={14} />
                    {STATUT_COURRIER_LABELS[selectedCourrier.statut]}
                  </span>
                  <span style={{ 
                    backgroundColor: URGENCE_COURRIER_COLORS[selectedCourrier.urgence], 
                    color: 'white', 
                    padding: '6px 14px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    <Zap size={14} />
                    {URGENCE_COURRIER_LABELS[selectedCourrier.urgence]}
                  </span>
                  <span style={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)', 
                    color: 'white', 
                    padding: '6px 14px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    {selectedCourrier.type === 'Entrant' ? <Inbox size={14} /> : <Send size={14} />}
                    {selectedCourrier.type === 'Entrant' ? 'Entrant' : 'Sortant'}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation par onglets moderne */}
            <div style={{ 
              display: 'flex', 
              borderBottom: '1px solid #e2e8f0', 
              background: 'white', 
              padding: '0 32px',
              gap: 4
            }}>
              {[
                { id: 'infos', label: 'Détails', icon: <FileText size={16} /> },
                { id: 'document', label: 'Document & OCR', icon: <Paperclip size={16} /> },
                { id: 'historique', label: 'Historique', icon: <History size={16} /> }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveDetailTab(tab.id as 'infos' | 'document' | 'historique')}
                  style={{
                    padding: '16px 20px', 
                    border: 'none', 
                    background: activeDetailTab === tab.id ? 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' : 'transparent',
                    color: activeDetailTab === tab.id ? '#6366f1' : '#64748b',
                    fontWeight: activeDetailTab === tab.id ? 600 : 500,
                    borderBottom: activeDetailTab === tab.id ? '3px solid #6366f1' : '3px solid transparent',
                    cursor: 'pointer', 
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: '8px 8px 0 0',
                    fontSize: '14px'
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="modal-body" style={{ padding: '24px 32px', maxHeight: '60vh', overflowY: 'auto', background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' }}>
              {activeDetailTab === 'infos' && (
                <div style={{ display: 'grid', gap: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
                    {/* Card Expédition */}
                    <div style={{ 
                      background: 'white', 
                      borderRadius: '14px', 
                      padding: '20px 24px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                        <div style={{ 
                          width: 36, height: 36, borderRadius: '10px', 
                          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Send size={18} color="white" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>Expédition & Réception</h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <User size={16} style={{ color: '#6366f1' }} />
                          <div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expéditeur</div>
                            <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 500, marginTop: 2 }}>{selectedCourrier.expediteur}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <User size={16} style={{ color: '#8b5cf6' }} />
                          <div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Destinataire</div>
                            <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 500, marginTop: 2 }}>{selectedCourrier.destinataire}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Calendar size={16} style={{ color: '#a855f7' }} />
                          <div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Courrier</div>
                            <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 500, marginTop: 2 }}>{formatDate(selectedCourrier.dateCourrier)}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Clock size={16} style={{ color: '#ec4899' }} />
                          <div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Réception</div>
                            <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 500, marginTop: 2 }}>{formatDateTime(selectedCourrier.dateReception)}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Liaisons */}
                    <div style={{ 
                      background: 'white', 
                      borderRadius: '14px', 
                      padding: '20px 24px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                        <div style={{ 
                          width: 36, height: 36, borderRadius: '10px', 
                          background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Link2 size={18} color="white" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>Liaisons & Attribution</h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <ExternalLink size={16} style={{ color: '#10b981' }} />
                          <div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Réf. externe</div>
                            <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 500, marginTop: 2 }}>{selectedCourrier.referenceExterne || '—'}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <FolderOpen size={16} style={{ color: '#14b8a6' }} />
                          <div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dossier lié</div>
                            <div style={{ fontSize: '14px', color: selectedCourrier.dossierReference ? '#6366f1' : '#94a3b8', fontWeight: 500, marginTop: 2, cursor: selectedCourrier.dossierReference ? 'pointer' : 'default' }}>
                              {selectedCourrier.dossierReference || 'Aucun'}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <User size={16} style={{ color: '#0d9488' }} />
                          <div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigné à</div>
                            <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 500, marginTop: 2 }}>{selectedCourrier.assigneANom || 'Non assigné'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {selectedCourrier.notes && (
                    <div style={{ 
                      background: 'white', 
                      borderRadius: '14px', 
                      padding: '20px 24px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{ 
                          width: 36, height: 36, borderRadius: '10px', 
                          background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <FileText size={18} color="white" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>Notes</h3>
                      </div>
                      <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.6, background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        {selectedCourrier.notes}
                      </p>
                    </div>
                  )}

                  {/* Actions rapides */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', 
                    borderRadius: '14px', 
                    padding: '20px 24px',
                    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <Zap size={20} color="#fbbf24" />
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'white' }}>Actions rapides</h3>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {selectedCourrier.statut === 'Recu' && (
                        <button 
                          onClick={() => handleChangerStatut(selectedCourrier.id, 'EnTraitement')}
                          style={{
                            background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 20px',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                            transition: 'transform 0.2s, box-shadow 0.2s'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.5)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)'; }}
                        >
                          <Settings size={16} />
                          Mettre en traitement
                        </button>
                      )}
                      {selectedCourrier.statut === 'EnTraitement' && (
                        <button 
                          onClick={() => handleChangerStatut(selectedCourrier.id, 'Traite')}
                          style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 20px',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                            transition: 'transform 0.2s, box-shadow 0.2s'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.5)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)'; }}
                        >
                          <CheckCircle2 size={16} />
                          Marquer comme traité
                        </button>
                      )}
                      {selectedCourrier.statut !== 'Archive' && (
                        <button 
                          onClick={() => handleChangerStatut(selectedCourrier.id, 'Archive')}
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '10px',
                            padding: '10px 20px',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            backdropFilter: 'blur(10px)',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                        >
                          <Archive size={16} />
                          Archiver
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === 'document' && (
                <div style={{ display: 'grid', gap: 20 }}>
                  {selectedCourrier.hasDocument ? (
                    <>
                      <div style={{ 
                        background: 'white', 
                        borderRadius: '14px', 
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                          <div style={{ 
                            width: 40, height: 40, borderRadius: '12px', 
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <Paperclip size={20} color="white" />
                          </div>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Fichier joint</h3>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                          padding: '16px 20px', 
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ 
                              width: 48, height: 48, borderRadius: '10px', 
                              background: selectedCourrier.mimeType?.includes('pdf') ? '#ef4444' : '#3b82f6',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}>
                              <FileText size={24} color="white" />
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{selectedCourrier.nomFichier}</div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: 2 }}>
                                {selectedCourrier.mimeType} • {selectedCourrier.tailleFichier ? `${(selectedCourrier.tailleFichier / 1024).toFixed(1)} KB` : ''}
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDownloadDocument(selectedCourrier.id, selectedCourrier.nomFichier || 'document')}
                            style={{
                              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '10px 18px',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '13px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                              transition: 'transform 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                          >
                            <Download size={16} />
                            Télécharger
                          </button>
                        </div>
                      </div>
                      {selectedCourrier.texteOCR && (
                        <div style={{ 
                          background: 'white', 
                          borderRadius: '14px', 
                          padding: '24px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ 
                                width: 40, height: 40, borderRadius: '12px', 
                                background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                <Scan size={20} color="white" />
                              </div>
                              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Texte OCR extrait</h3>
                            </div>
                            {selectedCourrier.confianceOCR && (
                              <span style={{ 
                                background: selectedCourrier.confianceOCR > 80 ? '#dcfce7' : selectedCourrier.confianceOCR > 50 ? '#fef3c7' : '#fee2e2',
                                color: selectedCourrier.confianceOCR > 80 ? '#166534' : selectedCourrier.confianceOCR > 50 ? '#92400e' : '#991b1b',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 600
                              }}>
                                Confiance: {selectedCourrier.confianceOCR}%
                              </span>
                            )}
                          </div>
                          <div style={{ 
                            whiteSpace: 'pre-wrap', 
                            fontSize: '13px', 
                            color: '#334155',
                            background: '#f8fafc',
                            padding: '16px 20px',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            lineHeight: 1.7
                          }}>
                            {selectedCourrier.texteOCR}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '60px 40px', 
                      background: 'white',
                      borderRadius: '14px',
                      border: '2px dashed #e2e8f0'
                    }}>
                      <div style={{ 
                        width: 80, height: 80, borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px'
                      }}>
                        <FolderOpen size={36} style={{ color: '#94a3b8' }} />
                      </div>
                      <p style={{ margin: 0, fontSize: '15px', color: '#64748b', fontWeight: 500 }}>Aucun document joint à ce courrier</p>
                      <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#94a3b8' }}>Vous pouvez ajouter un document via l'édition</p>
                    </div>
                  )}
                </div>
              )}

              {activeDetailTab === 'historique' && (
                <div style={{ 
                  background: 'white', 
                  borderRadius: '14px', 
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ 
                      width: 40, height: 40, borderRadius: '12px', 
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <History size={20} color="white" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Historique des actions</h3>
                  </div>
                  {selectedCourrier.historiques && selectedCourrier.historiques.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {selectedCourrier.historiques.map((h, idx) => (
                        <div key={h.id} style={{ 
                          display: 'flex', 
                          gap: 16,
                          position: 'relative',
                          paddingLeft: 24,
                          paddingBottom: idx === selectedCourrier.historiques.length - 1 ? 0 : 24
                        }}>
                          {/* Ligne verticale */}
                          {idx < selectedCourrier.historiques.length - 1 && (
                            <div style={{ 
                              position: 'absolute', 
                              left: 7, 
                              top: 24, 
                              bottom: 0, 
                              width: 2, 
                              background: 'linear-gradient(180deg, #8b5cf6 0%, #e2e8f0 100%)'
                            }} />
                          )}
                          {/* Point */}
                          <div style={{ 
                            position: 'absolute',
                            left: 0,
                            top: 4,
                            width: 16, 
                            height: 16, 
                            borderRadius: '50%', 
                            background: idx === 0 ? 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)' : '#e2e8f0',
                            border: idx === 0 ? 'none' : '3px solid white',
                            boxShadow: idx === 0 ? '0 2px 8px rgba(139, 92, 246, 0.4)' : '0 1px 3px rgba(0,0,0,0.1)'
                          }} />
                          {/* Contenu */}
                          <div style={{ 
                            flex: 1, 
                            background: idx === 0 ? 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' : '#f8fafc', 
                            padding: '14px 18px', 
                            borderRadius: '10px',
                            border: idx === 0 ? '1px solid #c4b5fd' : '1px solid #e2e8f0'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{h.action}</span>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>
                                {formatDateTime(h.dateAction)}
                              </span>
                            </div>
                            {h.details && (
                              <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#475569' }}>{h.details}</p>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#64748b' }}>
                              <User size={12} />
                              <span>{h.userNom}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                      <History size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                      <p style={{ margin: 0, fontSize: '14px' }}>Aucun historique disponible</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ 
              padding: '16px 32px', 
              background: 'white', 
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12
            }}>
              <button 
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '10px 24px',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
