import { useEffect, useState } from 'react';
import { Shield, Check, X, Save, RefreshCw, Lock, Layout, Folder, FileText, Mail, Calendar, GraduationCap, Users, Settings, MessageSquare, Download, Upload, AlertCircle } from 'lucide-react';
import { useToast } from '../components/common/ToastProvider';
import { rolePermissionsApi, PermissionsMatrixDto, RolePermissionSummary, UpdateRoleModulePermissionDto } from '../api/rolePermissionsApi';

// Types pour la gestion des droits
type UserRole = 'Admin' | 'Manager' | 'Collaborateur' | 'Assistant' | 'AssistantJunior' | 'Consultant';

interface ModulePermission {
  moduleKey: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  roles: Record<UserRole, RolePermissionSummary>;
}

const ROLES: UserRole[] = ['Admin', 'Manager', 'Collaborateur', 'Assistant', 'AssistantJunior', 'Consultant'];

const ROLE_LABELS: Record<UserRole, string> = {
  Admin: 'Administrateur',
  Manager: 'Manager',
  Collaborateur: 'Collaborateur',
  Assistant: 'Assistant',
  AssistantJunior: 'Assistant Junior',
  Consultant: 'Consultant'
};

const ICON_MAP: Record<string, React.ReactNode> = {
  Layout: <Layout size={18} />,
  Folder: <Folder size={18} />,
  FileText: <FileText size={18} />,
  Mail: <Mail size={18} />,
  Calendar: <Calendar size={18} />,
  GraduationCap: <GraduationCap size={18} />,
  Users: <Users size={18} />,
  MessageSquare: <MessageSquare size={18} />,
  Settings: <Settings size={18} />
};

export default function RightsManagementPage() {
  const { notify } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changedPermissions, setChangedPermissions] = useState<Set<string>>(new Set());

  // État initial des modules (chargé via API)
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [originalPermissions, setOriginalPermissions] = useState<ModulePermission[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role !== 'Admin') {
        notify({ type: 'error', message: 'Accès refusé : Droits administrateur requis' });
        window.history.back();
      } else {
        setIsAdmin(true);
        loadPermissions();
      }
    }
  }, [notify]);

  const loadPermissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const matrix = await rolePermissionsApi.getPermissionsMatrix();
      
      // Transformer la matrice en format ModulePermission[]
      const moduleList: ModulePermission[] = matrix.modules.map(module => ({
        moduleKey: module.key,
        label: module.label,
        icon: ICON_MAP[module.icon] || <Layout size={18} />,
        description: module.description,
        roles: {} as Record<UserRole, RolePermissionSummary>
      }));

      // Remplir les permissions pour chaque rôle
      matrix.roles.forEach(roleName => {
        moduleList.forEach(mod => {
          const rolePermissions = matrix.matrix[mod.moduleKey]?.[roleName];
          if (rolePermissions) {
            mod.roles[roleName as UserRole] = rolePermissions;
          }
        });
      });

      setPermissions(moduleList);
      setOriginalPermissions(JSON.parse(JSON.stringify(moduleList)));
      setChangedPermissions(new Set());
    } catch (e: any) {
      const errorMsg = e.response?.data?.message || 'Erreur lors du chargement des droits';
      setError(errorMsg);
      notify({ type: 'error', message: errorMsg });
      console.error('Erreur:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (moduleKey: string, role: UserRole, field: keyof RolePermissionSummary) => {
    // Sécurité : Empêcher de retirer l'accès Admin au module Admin
    if (role === 'Admin' && moduleKey === 'admin' && field === 'hasAccess') return;

    setPermissions(prev => prev.map(mod => {
      if (moduleKey === mod.moduleKey) {
        const updatedRole = { ...mod.roles[role] };
        updatedRole[field] = !updatedRole[field];
        
        // Si hasAccess est false, désactiver les autres permissions
        if (field === 'hasAccess' && !updatedRole.hasAccess) {
          updatedRole.canCreate = false;
          updatedRole.canUpdate = false;
          updatedRole.canDelete = false;
          updatedRole.canExport = false;
        }

        return {
          ...mod,
          roles: { ...mod.roles, [role]: updatedRole }
        };
      }
      return mod;
    }));

    // Tracker les changements
    setChangedPermissions(prev => {
      const newSet = new Set(prev);
      newSet.add(`${moduleKey}:${role}`);
      return newSet;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Construire les updates nécessaires
      const updates = Array.from(changedPermissions).map(key => {
        const [moduleKey, role] = key.split(':');
        const roleType = role as UserRole;
        const modulePermissions = permissions.find(p => p.moduleKey === moduleKey);
        const permissionData = modulePermissions?.roles[roleType];

        return {
          role: roleType,
          moduleKey,
          permission: {
            hasAccess: permissionData?.hasAccess || false,
            canCreate: permissionData?.canCreate || false,
            canUpdate: permissionData?.canUpdate || false,
            canDelete: permissionData?.canDelete || false,
            canExport: permissionData?.canExport || false
          } as UpdateRoleModulePermissionDto
        };
      });

      if (updates.length > 0) {
        await rolePermissionsApi.updateBatch(updates);
      }

      setOriginalPermissions(JSON.parse(JSON.stringify(permissions)));
      setChangedPermissions(new Set());
      notify({ type: 'success', message: '✅ Droits d\'accès mis à jour avec succès' });
    } catch (e: any) {
      const errorMsg = e.response?.data?.message || 'Erreur lors de la sauvegarde';
      setError(errorMsg);
      notify({ type: 'error', message: errorMsg });
      console.error('Erreur:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const json = await rolePermissionsApi.exportMatrix();
      const dataStr = JSON.stringify(JSON.parse(json), null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = 'permissions-matrix.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      notify({ type: 'success', message: '✅ Matrice des permissions exportée' });
    } catch (e: any) {
      notify({ type: 'error', message: 'Erreur lors de l\'export' });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setSaving(true);
      await rolePermissionsApi.importMatrix(text);
      await loadPermissions();
      notify({ type: 'success', message: '✅ Matrice des permissions importée avec succès' });
    } catch (e: any) {
      notify({ type: 'error', message: 'Erreur lors de l\'import du fichier' });
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="rights-management-page" style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1e293b', letterSpacing: '-1px', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Shield size={32} color="#4f46e5" /> Gestion des Droits d'Accès
            </h1>
            <p style={{ color: '#64748b', fontSize: '15px', marginTop: '8px' }}>
              Configurez les permissions d'accès aux modules applicatifs pour chaque rôle utilisateur.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={loadPermissions} 
              disabled={loading || saving}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Actualiser
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={handleExport} 
              disabled={loading || saving || permissions.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
            >
              <Download size={18} /> Exporter
            </button>
            <label style={{ margin: 0 }}>
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImport} 
                disabled={loading || saving}
                style={{ display: 'none' }}
              />
              <button 
                className="btn btn-secondary" 
                onClick={(e) => (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement)?.click()}
                disabled={loading || saving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                <Upload size={18} /> Importer
              </button>
            </label>
            <button 
              className="btn btn-primary" 
              onClick={handleSave} 
              disabled={loading || saving || changedPermissions.size === 0}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontWeight: 600, 
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', 
                border: 'none',
                boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)',
                opacity: changedPermissions.size === 0 ? 0.5 : 1
              }}
            >
              <Save size={18} /> {saving ? 'Enregistrement...' : `Enregistrer (${changedPermissions.size})`}
            </button>
          </div>
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div style={{ marginBottom: '24px', padding: '16px', background: '#fee2e2', borderRadius: '12px', border: '1px solid #fca5a5', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <AlertCircle size={20} color="#dc2626" style={{ marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 600, color: '#991b1b' }}>Erreur</div>
            <div style={{ fontSize: '14px', color: '#7f1d1d', marginTop: '4px' }}>{error}</div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: '18px', color: '#64748b' }}>Chargement des droits d'accès...</div>
        </div>
      )}

      {/* Matrice des permissions - Vue en cartes */}
      {!loading && permissions.length > 0 && (
        <div>
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>Matrice des Permissions</h2>
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>({permissions.length} modules)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: '16px' }}>
            {permissions.map((mod) => (
              <div key={mod.moduleKey} style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', overflow: 'hidden', transition: 'all 0.2s' }}>
                {/* Module Header */}
                <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f0f4ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {mod.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '14px' }}>{mod.label}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{mod.description}</div>
                  </div>
                </div>

                {/* Roles Grid */}
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {ROLES.map(role => {
                      const permissionData = mod.roles[role];
                      const isRestricted = role === 'Admin' && mod.moduleKey === 'admin';
                      const hasChanged = changedPermissions.has(`${mod.moduleKey}:${role}`);
                      
                      return (
                        <div key={role} style={{ 
                          padding: '12px', 
                          background: hasChanged ? '#f0f4ff' : '#f9fafb',
                          borderRadius: '10px',
                          border: hasChanged ? '1px solid #dbeafe' : '1px solid #e5e7eb',
                          transition: 'all 0.2s'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            {/* Toggle hasAccess */}
                            <button
                              onClick={() => handleToggle(mod.moduleKey, role, 'hasAccess')}
                              disabled={isRestricted}
                              title={permissionData?.hasAccess ? 'Accès autorisé' : 'Accès refusé'}
                              style={{
                                width: '40px',
                                height: '24px',
                                borderRadius: '12px',
                                border: 'none',
                                background: permissionData?.hasAccess ? '#10b981' : '#cbd5e1',
                                position: 'relative',
                                cursor: isRestricted ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                opacity: isRestricted ? 0.6 : 1,
                                padding: 0,
                                flexShrink: 0
                              }}
                            >
                              <div style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                background: 'white',
                                position: 'absolute',
                                top: '3px',
                                left: permissionData?.hasAccess ? '21px' : '1px',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                              }}>
                                {permissionData?.hasAccess ? <Check size={12} color="#10b981" strokeWidth={3} /> : <X size={12} color="#94a3b8" strokeWidth={3} />}
                              </div>
                            </button>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', flex: 1 }}>{ROLE_LABELS[role]}</span>
                            {isRestricted && <Lock size={14} color="#94a3b8" />}
                          </div>

                          {/* Additional permissions (if hasAccess) */}
                          {permissionData?.hasAccess && !isRestricted && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                              <button
                                onClick={() => handleToggle(mod.moduleKey, role, 'canCreate')}
                                title="Créer"
                                style={{
                                  height: '24px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: permissionData?.canCreate ? '#3b82f6' : '#e5e7eb',
                                  color: permissionData?.canCreate ? 'white' : '#6b7280',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s'
                                }}
                              >
                                C
                              </button>
                              <button
                                onClick={() => handleToggle(mod.moduleKey, role, 'canUpdate')}
                                title="Modifier"
                                style={{
                                  height: '24px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: permissionData?.canUpdate ? '#8b5cf6' : '#e5e7eb',
                                  color: permissionData?.canUpdate ? 'white' : '#6b7280',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s'
                                }}
                              >
                                U
                              </button>
                              <button
                                onClick={() => handleToggle(mod.moduleKey, role, 'canDelete')}
                                title="Supprimer"
                                style={{
                                  height: '24px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: permissionData?.canDelete ? '#ef4444' : '#e5e7eb',
                                  color: permissionData?.canDelete ? 'white' : '#6b7280',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s'
                                }}
                              >
                                D
                              </button>
                              <button
                                onClick={() => handleToggle(mod.moduleKey, role, 'canExport')}
                                title="Exporter"
                                style={{
                                  height: '24px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: permissionData?.canExport ? '#06b6d4' : '#e5e7eb',
                                  color: permissionData?.canExport ? 'white' : '#6b7280',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s'
                                }}
                              >
                                E
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note de sécurité */}
      <div style={{ marginTop: '24px', padding: '20px', background: '#eff6ff', borderRadius: '16px', border: '1px solid #bfdbfe', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <Shield size={24} color="#1e40af" style={{ marginTop: '2px' }} />
        <div>
          <h4 style={{ margin: 0, color: '#1e40af', fontWeight: 700, fontSize: '15px' }}>Note sur la sécurité</h4>
          <p style={{ margin: '4px 0 0 0', color: '#1e3a8a', fontSize: '13px', lineHeight: 1.5 }}>
            Les modifications apportées ici prennent effet immédiatement pour toutes les sessions actives. 
            Le rôle <strong>Administrateur</strong> conserve obligatoirement l'accès au module d'Administration pour éviter tout blocage du système.
            Les permissions utilisent un système granulaire : <strong>C</strong> (Créer), <strong>U</strong> (Modifier), <strong>D</strong> (Supprimer), <strong>E</strong> (Exporter).
          </p>
        </div>
      </div>

      <style>{`
        .hover-row:hover { background-color: #f8fafc; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}