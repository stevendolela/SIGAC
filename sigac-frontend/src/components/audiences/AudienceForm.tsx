import { useState, useEffect } from 'react'
import { audienceApi } from '../../api/audienceApi'
import { dossierApi } from '../../api/dossierApi'
import { salleApi } from '../../api/salleApi'
import type { CreateAudienceDto, UpdateAudienceDto, AudienceDetailDto, TypeAudience, StatutAudience } from '../../types/audience'
import { typeAudienceLabels, statutAudienceLabels } from '../../types/audience'
import type { DossierListDto } from '../../types/dossier'
import type { SalleListDto } from '../../types/salle'

interface AudienceFormProps {
  audienceId?: string
  dossierId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function AudienceForm({ audienceId, dossierId, onSuccess, onCancel }: AudienceFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audience, setAudience] = useState<AudienceDetailDto | null>(null)
  const [dossiers, setDossiers] = useState<DossierListDto[]>([])
  const [loadingDossiers, setLoadingDossiers] = useState(false)
  const [salles, setSalles] = useState<SalleListDto[]>([])
  const [loadingSalles, setLoadingSalles] = useState(false)
  const [selectedSalleId, setSelectedSalleId] = useState<string>('')
  
  const [formData, setFormData] = useState({
    dossierId: dossierId || '',
    dateAudience: '',
    lieu: '',
    typeAudience: 0,
    statut: 0,
    observations: '',
    compteRendu: ''
  })

  useEffect(() => {
    if (dossierId && !audienceId) {
      setFormData(prev => ({ ...prev, dossierId }))
    }
  }, [dossierId, audienceId])

  useEffect(() => {
    if (!dossierId && !audienceId) {
      loadDossiers()
    }
  }, [dossierId, audienceId])

  useEffect(() => {
    // Charger les salles actives pour sélection
    loadSalles()
  }, [])

  useEffect(() => {
    if (audienceId) {
      loadAudience()
    }
  }, [audienceId])

  const loadDossiers = async () => {
    try {
      setLoadingDossiers(true)
      const result = await dossierApi.list({ page: 1, pageSize: 100 })
      setDossiers(result.data)
    } catch (err: any) {
      console.error('Erreur chargement dossiers:', err)
    } finally {
      setLoadingDossiers(false)
    }
  }

  const loadAudience = async () => {
    if (!audienceId) return

    try {
      setLoading(true)
      const data = await audienceApi.getById(audienceId)
      setAudience(data)
      
      // Format date for input[type="datetime-local"]
      const date = new Date(data.dateAudience)
      const formatted = date.toISOString().slice(0, 16)
      
      setFormData({
        dossierId: data.dossierId,
        dateAudience: formatted,
        lieu: data.lieu,
        typeAudience: data.typeAudience,
        statut: data.statut,
        observations: data.observations || '',
        compteRendu: data.compteRendu || ''
      })
      // Pré-sélectionner la salle si le lieu correspond
      try {
        const currentLieu = data.lieu?.trim()
        if (currentLieu && salles.length > 0) {
          const found = salles.find(s => s.nom.toLowerCase() === currentLieu.toLowerCase())
          setSelectedSalleId(found ? found.id : '')
        }
      } catch {
        // best-effort
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const loadSalles = async () => {
    try {
      setLoadingSalles(true)
      const list = await salleApi.list(true)
      setSalles(list)
      // Si un lieu est déjà saisi, tenter une correspondance
      const currentLieu = formData.lieu?.trim()
      if (currentLieu) {
        const found = list.find(s => s.nom.toLowerCase() === currentLieu.toLowerCase())
        setSelectedSalleId(found ? found.id : '')
      }
    } catch (err) {
      // silencieux: la création peut continuer sans salles
      console.warn('Impossible de charger les salles', err)
    } finally {
      setLoadingSalles(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    // Debug minimal (désactivé en production): garder uniquement si besoin ponctuel
    // console.debug('[AudienceForm] submit', { formData, dossierProp: dossierId, audienceId })

    // Validation
    if (!formData.dossierId) {
      setError('Le dossier est requis')
      return
    }
    if (!formData.dateAudience) {
      setError('La date est requise')
      return
    }
    if (!formData.lieu.trim()) {
      setError('Le lieu est requis')
      return
    }

    // Vérifier que la date n'est pas dans le passé (sauf si modification)
    const selectedDate = new Date(formData.dateAudience)
    if (!audienceId && selectedDate < new Date()) {
      setError('La date ne peut pas être dans le passé')
      return
    }

    try {
      setLoading(true)

      if (audienceId) {
        // Mise à jour
        const updateDto: UpdateAudienceDto = {
          dateAudience: new Date(formData.dateAudience).toISOString(),
          lieu: formData.lieu,
          typeAudience: formData.typeAudience as TypeAudience,
          statut: formData.statut as StatutAudience,
          observations: formData.observations || undefined,
          compteRendu: formData.compteRendu || undefined
        }
        await audienceApi.update(audienceId, updateDto)
      } else {
        // Création
        const createDto: CreateAudienceDto = {
          dossierId: formData.dossierId,
          dateAudience: new Date(formData.dateAudience).toISOString(),
          lieu: formData.lieu,
          typeAudience: formData.typeAudience as TypeAudience,
          observations: formData.observations || undefined
        }
        await audienceApi.create(createDto)
      }

      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'typeAudience' || name === 'statut' ? parseInt(value) : value
    }))
  }

  const handleSalleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setSelectedSalleId(id)
    const salle = salles.find(s => s.id === id)
    setFormData(prev => ({ ...prev, lieu: salle ? salle.nom : '' }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!dossierId && !audienceId && (
        <div>
          <label htmlFor="dossierId" className="block text-sm font-medium text-gray-700">
            Dossier <span className="text-red-500">*</span>
          </label>
          {loadingDossiers ? (
            <div className="mt-1 text-sm text-gray-500">Chargement des dossiers...</div>
          ) : (
            <select
              id="dossierId"
              name="dossierId"
              value={formData.dossierId}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">-- Sélectionner un dossier --</option>
              {dossiers.map(dossier => (
                <option key={dossier.id} value={dossier.id}>
                  {dossier.numeroDossier} - {dossier.titre}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
      {dossierId && !audienceId && (
        // Lorsque le dossierId est imposé par le parent, on l'injecte en champ hidden pour éviter tout oubli
        <input type="hidden" name="dossierId" value={formData.dossierId} />
      )}

      <div>
        <label htmlFor="dateAudience" className="block text-sm font-medium text-gray-700">
          Date et heure <span className="text-red-500">*</span>
        </label>
        <input
          type="datetime-local"
          id="dateAudience"
          name="dateAudience"
          value={formData.dateAudience}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="salleId" className="block text-sm font-medium text-gray-700">
          Salle (optionnel)
        </label>
        {loadingSalles ? (
          <div className="mt-1 text-sm text-gray-500">Chargement des salles...</div>
        ) : (
          <select
            id="salleId"
            name="salleId"
            value={selectedSalleId}
            onChange={handleSalleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">-- Sélectionner une salle --</option>
            {salles.map(s => (
              <option key={s.id} value={s.id}>
                {s.nom} {typeof s.capacite === 'number' ? `(cap. ${s.capacite})` : ''}
              </option>
            ))}
          </select>
        )}
        <p className="mt-1 text-xs text-gray-500">Si une salle est sélectionnée, le champ Lieu sera prérempli.</p>
      </div>

      <div>
        <label htmlFor="lieu" className="block text-sm font-medium text-gray-700">
          Lieu <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="lieu"
          name="lieu"
          value={formData.lieu}
          onChange={handleChange}
          required
          maxLength={200}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="typeAudience" className="block text-sm font-medium text-gray-700">
          Type d'événement <span className="text-red-500">*</span>
        </label>
        <select
          id="typeAudience"
          name="typeAudience"
          value={formData.typeAudience}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          {Object.entries(typeAudienceLabels).map(([key, label]) => (
            <option key={key} value={parseInt(key)}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {audienceId && (
        <div>
          <label htmlFor="statut" className="block text-sm font-medium text-gray-700">
            Statut
          </label>
          <select
            id="statut"
            name="statut"
            value={formData.statut}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {Object.entries(statutAudienceLabels).map(([key, label]) => (
              <option key={key} value={parseInt(key)}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="observations" className="block text-sm font-medium text-gray-700">
          Observations
        </label>
        <textarea
          id="observations"
          name="observations"
          value={formData.observations}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {audienceId && (
        <div>
          <label htmlFor="compteRendu" className="block text-sm font-medium text-gray-700">
            Compte-rendu
          </label>
          <textarea
            id="compteRendu"
            name="compteRendu"
            value={formData.compteRendu}
            onChange={handleChange}
            rows={5}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : audienceId ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  )
}
