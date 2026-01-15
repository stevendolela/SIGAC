import React, { useState } from 'react';
import { BulkImportDocumentsDto, BulkImportDocumentsResultDto } from '../types/documentImport';
import './ImportDocumentsPage.css';

type ImportStep = 'upload' | 'preview' | 'result';

interface DocumentPreview {
  NumeroDossier: string;
  NomFichier: string;
  TypeDocument: string;
  EstConfidentiel: boolean;
}

const ImportDocumentsPage: React.FC = () => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<DocumentPreview[]>([]);
  const [result, setResult] = useState<BulkImportDocumentsResultDto | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('❌ Seuls les fichiers CSV sont acceptés');
        return;
      }
      setFile(selectedFile);
      setError('');
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (csvFile: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      
      if (lines.length < 2) {
        setError('❌ Le fichier CSV est vide');
        return;
      }

      const headers = lines[0].split(';').map((h) => h.trim());
      const requiredColumns = ['NumeroDossier', 'NomFichier', 'TypeDocument'];
      
      const missingColumns = requiredColumns.filter(
        (col) => !headers.includes(col)
      );

      if (missingColumns.length > 0) {
        setError(`❌ Colonnes manquantes: ${missingColumns.join(', ')}`);
        return;
      }

      const previews: DocumentPreview[] = [];
      const parseErrors: string[] = [];

      for (let i = 1; i < Math.min(lines.length, 11); i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const values = line.split(';');
          const doc: DocumentPreview = {
            NumeroDossier: values[headers.indexOf('NumeroDossier')]?.trim() || '',
            NomFichier: values[headers.indexOf('NomFichier')]?.trim() || '',
            TypeDocument: values[headers.indexOf('TypeDocument')]?.trim() || '',
            EstConfidentiel: values[headers.indexOf('EstConfidentiel')]?.trim()?.toLowerCase() === 'oui',
          };

          if (doc.NumeroDossier && doc.NomFichier && doc.TypeDocument) {
            previews.push(doc);
          } else {
            parseErrors.push(`Ligne ${i + 1}: Données incomplètes`);
          }
        } catch (err) {
          parseErrors.push(`Ligne ${i + 1}: ${(err as Error).message}`);
        }
      }

      if (previews.length === 0) {
        setError(`❌ Aucun document valide trouvé. ${parseErrors.join('; ')}`);
        return;
      }

      setPreview(previews);
      setStep('preview');
      setError('');
    };
    reader.readAsText(csvFile);
  };

  const handleImport = async () => {
    if (!file || preview.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(';').map((h) => h.trim());

        const documents = lines.slice(1).map((line) => {
          const values = line.split(';');
          return {
            NumeroDossier: values[headers.indexOf('NumeroDossier')]?.trim() || '',
            NomFichier: values[headers.indexOf('NomFichier')]?.trim() || '',
            TypeDocument: values[headers.indexOf('TypeDocument')]?.trim() || '',
            UrlDocument: values[headers.indexOf('UrlDocument')]?.trim() || '',
            Description: values[headers.indexOf('Description')]?.trim() || '',
            EstConfidentiel: values[headers.indexOf('EstConfidentiel')]?.trim()?.toLowerCase() === 'oui',
          };
        }).filter(doc => doc.NumeroDossier && doc.NomFichier);

        const payload: BulkImportDocumentsDto = { Documents: documents };

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5210/api';
        const token = localStorage.getItem('token');

        const response = await fetch(`${apiUrl}/DocumentImport/dossiers`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data: BulkImportDocumentsResultDto = await response.json();

        if (!response.ok) {
          setError(`❌ ${data.message}`);
          setStep('result');
          setResult(data);
          return;
        }

        setResult(data);
        setStep('result');
      };
      reader.readAsText(file);
    } catch (err) {
      setError(`❌ Erreur: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetImport = () => {
    setStep('upload');
    setFile(null);
    setPreview([]);
    setResult(null);
    setError('');
  };

  return (
    <div className="import-documents-container">
      <h1>📄 Import en Masse de Documents</h1>

      {/* ÉTAPE 1: Upload */}
      {step === 'upload' && (
        <div className="import-step upload-step">
          <h2>Étape 1: Sélectionner le fichier CSV</h2>
          
          <div className="upload-box">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              id="csv-input"
            />
            <label htmlFor="csv-input">
              📁 Cliquer pour sélectionner le fichier CSV
            </label>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="csv-template">
            <h3>📋 Format du CSV Requis</h3>
            <p>⚠️ <strong>Important:</strong> Utilisez des <strong>points-virgules (;)</strong> comme séparateur</p>
            
            <div className="template-code">
              <pre>
{`NumeroDossier;NomFichier;TypeDocument;UrlDocument;Description;EstConfidentiel
2024-001;Requete.pdf;Requête;;;non
2024-002;Justificatif.pdf;Pièces justificatives;https://example.com/doc.pdf;;oui
2024-003;Contrat.docx;Contrat;;;non`}
              </pre>
            </div>

            <div className="template-info">
              <h4>Colonnes</h4>
              <ul>
                <li><strong>NumeroDossier</strong> ✅ Requis - Référence au dossier (ex: 2024-001)</li>
                <li><strong>NomFichier</strong> ✅ Requis - Nom du fichier (ex: Requete.pdf)</li>
                <li><strong>TypeDocument</strong> ✅ Requis - Type (ex: Requête, Pièces justificatives)</li>
                <li><strong>UrlDocument</strong> ❌ Optionnel - URL du fichier à télécharger</li>
                <li><strong>Description</strong> ❌ Optionnel - Métadata supplémentaire</li>
                <li><strong>EstConfidentiel</strong> ❌ Optionnel - oui/non (défaut: non)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ÉTAPE 2: Preview */}
      {step === 'preview' && (
        <div className="import-step preview-step">
          <h2>Étape 2: Aperçu des Documents</h2>
          <p>📊 {preview.length} document(s) à importer</p>

          <div className="preview-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Numéro Dossier</th>
                  <th>Nom Fichier</th>
                  <th>Type Document</th>
                  <th>Confidentiel</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((doc, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{doc.NumeroDossier}</td>
                    <td>{doc.NomFichier}</td>
                    <td>{doc.TypeDocument}</td>
                    <td>{doc.EstConfidentiel ? '🔒 Oui' : 'Non'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="button-group">
            <button onClick={resetImport} className="btn-secondary">
              ← Retour
            </button>
            <button 
              onClick={handleImport} 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? '⏳ Import en cours...' : '✓ Importer les Documents'}
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 3: Résultat */}
      {step === 'result' && result && (
        <div className="import-step result-step">
          <h2>Étape 3: Résultat de l'Import</h2>

          <div className={`result-box ${result.success ? 'success' : 'error'}`}>
            <h3>{result.success ? '✅ Succès' : '❌ Erreur'}</h3>
            <p className="result-message">{result.message}</p>

            <div className="result-stats">
              <div className="stat">
                <strong>Créés:</strong>
                <span className="count">{result.documentsCreated}</span>
              </div>
              <div className="stat">
                <strong>Erreurs:</strong>
                <span className="count error">{result.documentsFailed}</span>
              </div>
            </div>

            {result.documentsCreatedNames.length > 0 && (
              <div className="created-list">
                <h4>📄 Documents Créés</h4>
                <ul>
                  {result.documentsCreatedNames.map((name, idx) => (
                    <li key={idx}>✓ {name}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="errors-list">
                <h4>⚠️ Erreurs</h4>
                <ul>
                  {result.errors.map((err, idx) => (
                    <li key={idx}>❌ {err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="button-group">
            <button onClick={resetImport} className="btn-primary">
              📥 Nouvel Import
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportDocumentsPage;
