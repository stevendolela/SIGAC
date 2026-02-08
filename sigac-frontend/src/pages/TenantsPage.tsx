/**
 * TenantsPage - Phase 3 Frontend
 * Page de gestion des tenants (organisations)
 * Affiche une liste paginée avec recherche et filtrage
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TenantListDto,
  TenantPlan,
  TenantPlanLabels,
  TenantPaginationResult,
} from "../types/tenant";
import { TenantApi } from "../api/tenantApi";
import "../styles.css";

interface TenantPageState {
  tenants: TenantListDto[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

export const TenantsPage: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<TenantPageState>({
    tenants: [],
    loading: true,
    error: null,
    page: 1,
    pageSize: 10,
    totalPages: 0,
    totalItems: 0,
  });

  // Charger les tenants au montage et quand la page change
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const result: TenantPaginationResult = await TenantApi.getTenantsPaginated(
          state.page,
          state.pageSize
        );
        setState((prev) => ({
          ...prev,
          tenants: result.data,
          totalPages: result.pagination.totalPages,
          totalItems: result.pagination.totalItems,
          loading: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: `Erreur: ${err instanceof Error ? err.message : "Impossible de charger les tenants"}`,
          loading: false,
        }));
      }
    };

    fetchTenants();
  }, [state.page, state.pageSize]);

  const handlePageChange = (newPage: number) => {
    setState((prev) => ({ ...prev, page: newPage }));
  };

  const handleNavigateToDetail = (tenantId: string) => {
    navigate(`/tenants/${tenantId}`);
  };

  const handleCreateNew = () => {
    navigate("/tenants/create");
  };

  const getPlanBadgeColor = (plan: TenantPlan) => {
    const colors: Record<TenantPlan, string> = {
      [TenantPlan.Free]: "badge-secondary",
      [TenantPlan.Starter]: "badge-info",
      [TenantPlan.Professional]: "badge-success",
      [TenantPlan.Enterprise]: "badge-warning",
      [TenantPlan.Custom]: "badge-danger",
    };
    return colors[plan];
  };

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col-md-8">
          <h1>Gestion des Tenants (Organisations)</h1>
          <p className="text-muted">
            Gérez les organisations/tenants du système multi-locataire
          </p>
        </div>
        <div className="col-md-4 text-end">
          <button type="button" className="btn btn-primary" onClick={handleCreateNew}>
            <i className="bi bi-plus-circle"></i> Nouveau Tenant
          </button>
        </div>
      </div>

      {state.error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-circle"></i> {state.error}
        </div>
      )}

      {state.loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Nom</th>
                  <th>Slug</th>
                  <th>Plan</th>
                  <th>Utilisateurs</th>
                  <th>Workspaces</th>
                  <th>Créé le</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.tenants.map((tenant, index) => (
                  <tr key={tenant.id}>
                    <td>{(state.page - 1) * state.pageSize + index + 1}</td>
                    <td>
                      <strong>{tenant.name}</strong>
                    </td>
                    <td>
                      <code>{tenant.slug}</code>
                    </td>
                    <td>
                      <span className={`badge ${getPlanBadgeColor(tenant.planEnum)}`}>
                        {TenantPlanLabels[tenant.planEnum]}
                      </span>
                    </td>
                    <td>{tenant.userCount}</td>
                    <td>{tenant.workspaceCount}</td>
                    <td>{new Date(tenant.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td>
                      {tenant.isActive ? (
                        <span className="badge bg-success">Actif</span>
                      ) : (
                        <span className="badge bg-danger">Inactif</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleNavigateToDetail(tenant.id)}
                        title="Voir les détails"
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary ms-1"
                        onClick={() => navigate(`/tenants/${tenant.id}/edit`)}
                        title="Modifier"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {state.tenants.length === 0 && (
            <div className="alert alert-info text-center">
              <i className="bi bi-info-circle"></i> Aucun tenant trouvé. Créez-en un pour démarrer.
            </div>
          )}

          {/* Pagination */}
          <nav aria-label="Pagination">
            <ul className="pagination justify-content-center">
              <li className={`page-item ${state.page === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(state.page - 1)}
                  disabled={state.page === 1}
                >
                  Précédent
                </button>
              </li>

              {Array.from({ length: Math.min(state.totalPages, 5) }, (_, i) => {
                const pageNum = state.page - 2 + i;
                if (pageNum < 1 || pageNum > state.totalPages) return null;
                return (
                  <li
                    key={pageNum}
                    className={`page-item ${state.page === pageNum ? "active" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  </li>
                );
              })}

              <li
                className={`page-item ${state.page === state.totalPages ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(state.page + 1)}
                  disabled={state.page === state.totalPages}
                >
                  Suivant
                </button>
              </li>
            </ul>
          </nav>

          <div className="text-center text-muted small mt-2">
            Total: {state.totalItems} tenant(s) - Page {state.page} sur {state.totalPages}
          </div>
        </>
      )}
    </div>
  );
};

export default TenantsPage;
