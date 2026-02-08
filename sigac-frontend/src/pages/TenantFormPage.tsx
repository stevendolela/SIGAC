/**
 * TenantFormPage - Phase 3 Frontend
 * Formulaire pour créer ou modifier un tenant
 * POST /api/tenants (création) - Admin only
 * PUT /api/tenants/{id} (modification) - Admin only
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  TenantDto,
  CreateTenantDto,
  UpdateTenantDto,
  TenantPlan,
  TenantPlanLabels,
} from "../types/tenant";
import { TenantApi } from "../api/tenantApi";
import "../styles.css";

interface FormState {
  name: string;
  slug: string;
  description: string;
  planEnum: TenantPlan;
  maxUsers: number;
  maxStorageGB: number;
  maxWorkspaces: number;
  isActive: boolean;
}

export const TenantFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [form, setForm] = useState<FormState>({
    name: "",
    slug: "",
    description: "",
    planEnum: TenantPlan.Starter,
    maxUsers: 10,
    maxStorageGB: 100,
    maxWorkspaces: 5,
    isActive: true,
  });

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Charger le tenant si en mode édition
  useEffect(() => {
    if (!isEditing) {
      setLoading(false);
      return;
    }

    const fetchTenant = async () => {
      try {
        setLoading(true);
        setError(null);
        const tenant = await TenantApi.getTenantById(id!);
        setForm({
          name: tenant.name,
          slug: tenant.slug,
          description: tenant.description || "",
          planEnum: tenant.planEnum,
          maxUsers: tenant.maxUsers,
          maxStorageGB: tenant.maxStorageGB,
          maxWorkspaces: tenant.maxWorkspaces,
          isActive: tenant.isActive,
        });
      } catch (err) {
        setError(`Erreur: ${err instanceof Error ? err.message : "Impossible de charger le tenant"}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [id, isEditing]);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.name.trim()) {
      errors.name = "Le nom est requis";
    }
    if (!form.slug.trim()) {
      errors.slug = "Le slug est requis";
    }
    if (!/^[a-z0-9\-]+$/.test(form.slug)) {
      errors.slug = "Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets";
    }
    if (form.maxUsers < 1) {
      errors.maxUsers = "Le nombre d'utilisateurs doit être au moins 1";
    }
    if (form.maxStorageGB < 1) {
      errors.maxStorageGB = "Le stockage doit être au moins 1 GB";
    }
    if (form.maxWorkspaces < 1) {
      errors.maxWorkspaces = "Le nombre de workspaces doit être au moins 1";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const userId = localStorage.getItem("userId") || "system";

      if (isEditing) {
        // Mode édition
        const updateDto: UpdateTenantDto = {
          name: form.name,
          slug: form.slug,
          description: form.description,
          planEnum: form.planEnum,
          maxUsers: form.maxUsers,
          maxStorageGB: form.maxStorageGB,
          maxWorkspaces: form.maxWorkspaces,
          isActive: form.isActive,
          updatedBy: userId,
        };
        await TenantApi.updateTenant(id!, updateDto);
        navigate(`/tenants/${id}`);
      } else {
        // Mode création
        const createDto: CreateTenantDto = {
          name: form.name,
          slug: form.slug,
          description: form.description,
          planEnum: form.planEnum,
          maxUsers: form.maxUsers,
          maxStorageGB: form.maxStorageGB,
          maxWorkspaces: form.maxWorkspaces,
          createdBy: userId,
        };
        const newTenant = await TenantApi.createTenant(createDto);
        navigate(`/tenants/${newTenant.id}`);
      }
    } catch (err) {
      setError(`Erreur: ${err instanceof Error ? err.message : "Erreur inconnue"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? Number(value)
          : type === "select-one"
          ? Number(value)
          : value,
    }));

    // Effacer l'erreur du champ quand l'utilisateur commence à éditer
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (loading) {
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

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-8 offset-md-2">
          <h1>{isEditing ? "Modifier le tenant" : "Créer une nouveau tenant"}</h1>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-circle"></i> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Nom */}
            <div className="mb-3">
              <label htmlFor="name" className="form-label">
                Nom <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${validationErrors.name ? "is-invalid" : ""}`}
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="ex: Tenant Juridique RDC"
              />
              {validationErrors.name && (
                <div className="invalid-feedback">{validationErrors.name}</div>
              )}
            </div>

            {/* Slug */}
            <div className="mb-3">
              <label htmlFor="slug" className="form-label">
                Slug <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${validationErrors.slug ? "is-invalid" : ""}`}
                id="slug"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="ex: tenant-juridique-rdc"
                disabled={isEditing} // Ne pas permettre la modification du slug
              />
              {validationErrors.slug && (
                <div className="invalid-feedback">{validationErrors.slug}</div>
              )}
              <small className="form-text text-muted">
                Identifiant unique en minuscules, chiffres et tirets seulement
              </small>
            </div>

            {/* Description */}
            <div className="mb-3">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                className="form-control"
                id="description"
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
                placeholder="Description optionnelle du tenant"
              ></textarea>
            </div>

            {/* Plan */}
            <div className="mb-3">
              <label htmlFor="planEnum" className="form-label">
                Plan <span className="text-danger">*</span>
              </label>
              <select
                className="form-select"
                id="planEnum"
                name="planEnum"
                value={form.planEnum}
                onChange={handleChange}
              >
                {Object.entries(TenantPlanLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Limites */}
            <div className="card mb-3">
              <div className="card-header">
                <h6 className="mb-0">Limites du plan</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  {/* Max Users */}
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="maxUsers" className="form-label">
                        Utilisateurs max <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className={`form-control ${validationErrors.maxUsers ? "is-invalid" : ""}`}
                        id="maxUsers"
                        name="maxUsers"
                        value={form.maxUsers}
                        onChange={handleChange}
                        min="1"
                      />
                      {validationErrors.maxUsers && (
                        <div className="invalid-feedback">{validationErrors.maxUsers}</div>
                      )}
                    </div>
                  </div>

                  {/* Max Storage */}
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="maxStorageGB" className="form-label">
                        Stockage (GB) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className={`form-control ${validationErrors.maxStorageGB ? "is-invalid" : ""}`}
                        id="maxStorageGB"
                        name="maxStorageGB"
                        value={form.maxStorageGB}
                        onChange={handleChange}
                        min="1"
                      />
                      {validationErrors.maxStorageGB && (
                        <div className="invalid-feedback">{validationErrors.maxStorageGB}</div>
                      )}
                    </div>
                  </div>

                  {/* Max Workspaces */}
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="maxWorkspaces" className="form-label">
                        Workspaces max <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className={`form-control ${validationErrors.maxWorkspaces ? "is-invalid" : ""}`}
                        id="maxWorkspaces"
                        name="maxWorkspaces"
                        value={form.maxWorkspaces}
                        onChange={handleChange}
                        min="1"
                      />
                      {validationErrors.maxWorkspaces && (
                        <div className="invalid-feedback">{validationErrors.maxWorkspaces}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statut (seulement en édition) */}
            {isEditing && (
              <div className="mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="isActive">
                    Tenant actif
                  </label>
                </div>
              </div>
            )}

            {/* Boutons */}
            <div className="d-grid gap-2 d-md-flex justify-content-md-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(isEditing ? `/tenants/${id}` : "/tenants")}
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i> {isEditing ? "Modifier" : "Créer"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TenantFormPage;
