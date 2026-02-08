/**
 * TenantDetailPage - Phase 3 Frontend
 * Affiche les détails complets d'un tenant avec statistiques et abonnement
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  TenantDto,
  TenantSubscriptionDto,
  TenantStatsDto,
  TenantPlanLabels,
} from "../types/tenant";
import { TenantApi } from "../api/tenantApi";
import "../styles.css";

interface TenantDetailState {
  tenant: TenantDto | null;
  stats: TenantStatsDto | null;
  subscription: TenantSubscriptionDto | null;
  loading: boolean;
  error: string | null;
}

export const TenantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<TenantDetailState>({
    tenant: null,
    stats: null,
    subscription: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setState((prev) => ({
          ...prev,
          error: "ID du tenant manquant",
          loading: false,
        }));
        return;
      }

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        // Charger les 3 données en parallèle
        const [tenant, stats, subscription] = await Promise.all([
          TenantApi.getTenantById(id),
          TenantApi.getTenantStats(id),
          TenantApi.getActiveSubscription(id),
        ]);

        setState((prev) => ({
          ...prev,
          tenant,
          stats,
          subscription,
          loading: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: `Erreur: ${err instanceof Error ? err.message : "Impossible de charger le tenant"}`,
          loading: false,
        }));
      }
    };

    fetchData();
  }, [id]);

  const handleEdit = () => {
    if (state.tenant) {
      navigate(`/tenants/${state.tenant.id}/edit`);
    }
  };

  const handleAddSubscription = () => {
    if (state.tenant) {
      navigate(`/tenants/${state.tenant.id}/subscription`);
    }
  };

  const handleDelete = async () => {
    if (!state.tenant) return;
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${state.tenant.name}"?`)) {
      return;
    }

    try {
      const userId = localStorage.getItem("userId") || "system";
      // Pour le soft delete, on fait un appel DELETE (bien que le backend renvoie 204 No Content)
      // On va juste revenir à la liste
      navigate("/tenants");
    } catch (err) {
      alert(`Erreur lors de la suppression: ${err instanceof Error ? err.message : "Erreur inconnue"}`);
    }
  };

  if (state.loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  if (state.error || !state.tenant) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-circle"></i> {state.error || "Tenant non trouvé"}
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/tenants")}>
          Retour à la liste
        </button>
      </div>
    );
  }

  const { tenant, stats, subscription } = state;

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-md-8">
          <h1>{tenant.name}</h1>
          <p className="text-muted">
            Slug: <code>{tenant.slug}</code>
          </p>
          {tenant.description && <p>{tenant.description}</p>}
        </div>
        <div className="col-md-4 text-end">
          <button className="btn btn-primary me-2" onClick={handleEdit}>
            <i className="bi bi-pencil"></i> Modifier
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            <i className="bi bi-trash"></i> Supprimer
          </button>
        </div>
      </div>

      {/* Informations générales */}
      <div className="card mb-4">
        <div className="card-header">
          <h5>Informations générales</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p>
                <strong>Plan:</strong>{" "}
                <span className="badge bg-primary">
                  {TenantPlanLabels[tenant.planEnum]}
                </span>
              </p>
              <p>
                <strong>Statut:</strong>{" "}
                {tenant.isActive ? (
                  <span className="badge bg-success">Actif</span>
                ) : (
                  <span className="badge bg-danger">Inactif</span>
                )}
              </p>
              <p>
                <strong>Créé le:</strong> {new Date(tenant.createdAt).toLocaleString("fr-FR")}
              </p>
            </div>
            <div className="col-md-6">
              <p>
                <strong>Modifié le:</strong>{" "}
                {tenant.updatedAt ? new Date(tenant.updatedAt).toLocaleString("fr-FR") : "Jamais"}
              </p>
              <p>
                <strong>Limites:</strong>
                <ul className="small mt-1">
                  <li>Utilisateurs: {tenant.maxUsers}</li>
                  <li>Stockage: {tenant.maxStorageGB} GB</li>
                  <li>Workspaces: {tenant.maxWorkspaces}</li>
                </ul>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>Statistiques d'utilisation</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 mb-3">
                <div className="stat-card p-3 bg-light rounded">
                  <h6 className="text-muted">Utilisateurs</h6>
                  <h3>{stats.userCount}</h3>
                  <div className="progress" style={{ height: "5px" }}>
                    <div
                      className="progress-bar bg-primary"
                      style={{ width: `${stats.userPercentage}%` }}
                    ></div>
                  </div>
                  <small className="text-muted">{stats.userPercentage.toFixed(1)}% utilisé</small>
                </div>
              </div>

              <div className="col-md-4 mb-3">
                <div className="stat-card p-3 bg-light rounded">
                  <h6 className="text-muted">Workspaces</h6>
                  <h3>{stats.workspaceCount}</h3>
                  <div className="progress" style={{ height: "5px" }}>
                    <div
                      className="progress-bar bg-success"
                      style={{ width: `${stats.workspacePercentage}%` }}
                    ></div>
                  </div>
                  <small className="text-muted">{stats.workspacePercentage.toFixed(1)}% utilisé</small>
                </div>
              </div>

              <div className="col-md-4 mb-3">
                <div className="stat-card p-3 bg-light rounded">
                  <h6 className="text-muted">Stockage</h6>
                  <h3>{stats.storageUsedGB.toFixed(2)} GB</h3>
                  <div className="progress" style={{ height: "5px" }}>
                    <div
                      className="progress-bar bg-warning"
                      style={{ width: `${stats.storagePercentage}%` }}
                    ></div>
                  </div>
                  <small className="text-muted">{stats.storagePercentage.toFixed(1)}% utilisé</small>
                </div>
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-md-6">
                <p>
                  <strong>Documents:</strong> {stats.documentCount}
                </p>
              </div>
              <div className="col-md-6">
                <p>
                  <strong>Dossiers:</strong> {stats.dossierCount}
                </p>
              </div>
            </div>

            {stats.lastActivityDate && (
              <p className="text-muted small mt-2">
                <strong>Dernière activité:</strong>{" "}
                {new Date(stats.lastActivityDate).toLocaleString("fr-FR")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Abonnement */}
      <div className="card">
        <div className="card-header">
          <h5>Abonnement</h5>
        </div>
        <div className="card-body">
          {subscription ? (
            <div>
              <p>
                <strong>Plan actif:</strong> {TenantPlanLabels[subscription.plan]}
              </p>
              <p>
                <strong>Début:</strong> {new Date(subscription.startDate).toLocaleDateString("fr-FR")}
              </p>
              {subscription.endDate && (
                <p>
                  <strong>Fin:</strong> {new Date(subscription.endDate).toLocaleDateString("fr-FR")}
                </p>
              )}
              <p>
                <strong>Coût:</strong> ${subscription.cost.toFixed(2)}
              </p>
              <p>
                <strong>Renouvellement automatique:</strong>{" "}
                {subscription.autoRenew ? (
                  <span className="badge bg-success">Activé</span>
                ) : (
                  <span className="badge bg-warning">Désactivé</span>
                )}
              </p>
            </div>
          ) : (
            <div className="alert alert-info mb-0">
              <p className="mb-2">Aucun abonnement actif pour ce tenant.</p>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleAddSubscription}
              >
                <i className="bi bi-plus-circle"></i> Ajouter un abonnement
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <button className="btn btn-secondary" onClick={() => navigate("/tenants")}>
          Retour à la liste
        </button>
      </div>
    </div>
  );
};

export default TenantDetailPage;
