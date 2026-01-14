import React, { useState } from 'react';
import './ImportDossiersPage.css';

interface ImportRow {
  numeroDossier: string;
  titre: string;
  description: string;
  typeAffaire: string;
  priorite: string;
  responsable: string;
  status: string;
  documents?: string; // URLs séparées par des points-virgules
}

interface ImportResult {
  success: boolean;
  message: string;
  dossiersCreated: number;
  documentsCreated: number;
  errors: string[];
}

export default function ImportDossiersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [errors, setErrors] = useState<string[]>([]);

  const token = localStorage.getItem('token');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setErrors([]);
    setFile(selectedFile);

    // Vérifie le format
    if (!selectedFile.name.endsWith('.csv')) {
      setErrors(['Format non supporté. Veuillez sélectionner un fichier CSV.']);
      setFile(null);
      return;
    }

    // Parse le CSV
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').filter(row => row.trim());
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());

        // Validation des colonnes requises
        const requiredColumns = ['numerodossier', 'titre', 'typeaffaire', 'priorite', 'status'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));

        if (missingColumns.length > 0) {
          setErrors([`Colonnes manquantes: ${missingColumns.join(', ')}`]);
          setFile(null);
          return;
        }

        // Parse les données
        const data: ImportRow[] = [];
        for (let i = 1; i < rows.length; i++) {
          const values = rows[i].split(',').map(v => v.trim());
          const row: ImportRow = {
            numeroDossier: values[headers.indexOf('numerodossier')] || '',
            titre: values[headers.indexOf('titre')] || '',
            description: values[headers.indexOf('description')] || '',
            typeAffaire: values[headers.indexOf('typeaffaire')] || '',
            priorite: values[headers.indexOf('priorite')] || 'Normale',
            responsable: values[headers.indexOf('responsable')] || '',
            status: values[headers.indexOf('status')] || 'Nouveau',
            documents: values[headers.indexOf('documents')] || '',
          };

          if (row.numeroDossier && row.titre) {
            data.push(row);
          }
        }

        if (data.length === 0) {
          setErrors(['Aucune ligne valide trouvée dans le fichier.']);
          setFile(null);
          return;
        }

        setPreview(data);
        setStep('preview');
      } catch (error) {
        setErrors(['Erreur lors de la lecture du fichier CSV.']);
        setFile(null);
      }
    };

    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!file || preview.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5210'}/Dossiers/import-bulk`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dossiers: preview,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: 'Import réussi!',
          dossiersCreated: data.dossiersCreated,
          documentsCreated: data.documentsCreated,
          errors: data.errors || [],
        });
      } else {
        setResult({
          success: false,
          message: data.message || 'Erreur lors de l\'import',
          dossiersCreated: 0,
          documentsCreated: 0,
          errors: data.errors || [],
        });
      }

      setStep('result');
    } catch (error) {
      setResult({
        success: false,
        message: 'Erreur de connexion',
        dossiersCreated: 0,
        documentsCreated: 0,
        errors: [String(error)],
      });
      setStep('result');
    } finally {
      setLoading(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setPreview([]);
    setResult(null);
    setErrors([]);
    setStep('upload');
  };

  return (
    <div className="import-container">
      <div className="import-header">
        <h1>📥 Import en masse de Dossiers</h1>
        <p>Importez plusieurs dossiers et documents à partir d'un fichier CSV</p>
      </div>

      {step === 'upload' && (
        <div className="import-upload">
          <div className="upload-box">
            <div className="upload-icon">📄</div>
            <h2>Sélectionnez un fichier CSV</h2>
            <p>Format: NumeroDossier, Titre, Description, TypeAffaire, Priorite, Responsable, Status, Documents</p>
            
            <label className="file-input-label">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="file-input"
              />
              <span className="file-input-button">Choisir un fichier</span>
            </label>

            {file && <p className="file-selected">✓ {file.name}</p>}
          </div>

          {errors.length > 0 && (
            <div className="error-box">
              <h3>❌ Erreurs:</h3>
              <ul>
                {errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="template-section">
            <h3>📋 Template CSV</h3>
            <pre className="template-code">
{`NumeroDossier,Titre,Description,TypeAffaire,Priorite,Responsable,Status,Documents
2024-001,Affaire A,Description affaire A,Contentieux,Haute,admin,Nouveau,
2024-002,Affaire B,Description affaire B,Constitutionnel,Normale,admin,Nouveau,`}
            </pre>
            <p className="template-note">
              <strong>Documents:</strong> URLs séparées par des points-virgules (;)
            </p>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="import-preview">
          <h2>Aperçu des données ({preview.length} dossiers)</h2>
          
          <div className="preview-table-wrapper">
            <table className="preview-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Numéro</th>
                  <th>Titre</th>
                  <th>Type</th>
                  <th>Priorité</th>
                  <th>Status</th>
                  <th>Docs</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 10).map((row, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{row.numeroDossier}</td>
                    <td>{row.titre.substring(0, 20)}</td>
                    <td>{row.typeAffaire}</td>
                    <td>{row.priorite}</td>
                    <td>{row.status}</td>
                    <td>{row.documents ? '✓' : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.length > 10 && (
            <p className="more-rows">... et {preview.length - 10} autres lignes</p>
          )}

          <div className="preview-actions">
            <button onClick={resetImport} className="cancel-btn">
              ← Retour
            </button>
            <button onClick={handleImport} className="import-btn" disabled={loading}>
              {loading ? '⏳ Import en cours...' : '✓ Importer'}
            </button>
          </div>
        </div>
      )}

      {step === 'result' && result && (
        <div className={`import-result ${result.success ? 'success' : 'error'}`}>
          <div className="result-icon">
            {result.success ? '✓' : '❌'}
          </div>
          
          <h2>{result.message}</h2>
          
          <div className="result-stats">
            <div className="stat">
              <span className="stat-label">Dossiers créés:</span>
              <span className="stat-value">{result.dossiersCreated}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Documents créés:</span>
              <span className="stat-value">{result.documentsCreated}</span>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="errors-box">
              <h3>⚠️ Avertissements/Erreurs ({result.errors.length}):</h3>
              <ul>
                {result.errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={resetImport} className="done-btn">
            ← Nouvelle importation
          </button>
        </div>
      )}
    </div>
  );
}
