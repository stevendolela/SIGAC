import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { userApi } from '../api/userApi'
import type { UserDto, UpdateUserDto, UserRole } from '../types/user'
import { useToast } from '../components/common/ToastProvider'

const roles: UserRole[] = [
  'Administrateur','President','JugeConstitutionnel','Greffier','GreffierAdjoint','Consultant'
]

export default function AdminUserEditPage() {
  const { id } = useParams<{id:string}>()
  const navigate = useNavigate()
  const { notify } = useToast()
  const [loading,setLoading]=useState(false)
  const [saving,setSaving]=useState(false)
  const [user,setUser]=useState<UserDto|null>(null)
  const [form,setForm]=useState<UpdateUserDto>({})

  useEffect(()=>{
    async function load(){
      if(!id) return
      setLoading(true)
      try {
        const u = await userApi.get(id)
        setUser(u)
        setForm({
          nomComplet: u.nomComplet || '',
          email: u.email,
          role: u.role,
          isActive: u.isActive,
          matricule: u.matricule || ''
        })
      } catch(e:any){
        notify({type:'error',message:e?.response?.data?.message||'Erreur chargement utilisateur'})
      } finally { setLoading(false) }
    }
    load()
  },[id])

  function update<K extends keyof UpdateUserDto>(key:K,value:UpdateUserDto[K]){
    setForm(f=>({...f,[key]:value}))
  }

  async function submit(e:React.FormEvent){
    e.preventDefault()
    if(!id) return
    setSaving(true)
    try {
      await userApi.update(id,form)
      notify({type:'success',message:'Utilisateur mis à jour'})
      navigate('/admin/users')
    } catch(e:any){
      notify({type:'error',message:e?.response?.data?.message||'Erreur sauvegarde'})
    } finally { setSaving(false) }
  }

  if(loading) return <div className="panel"><div>Chargement…</div></div>
  if(!user) return <div className="panel"><div>Utilisateur introuvable</div></div>

  return (
    <div className="panel">
      <div className="panel-title">✏️ Éditer Utilisateur</div>
      <form onSubmit={submit} className="form-grid">
        <label>
          Nom complet
          <input value={form.nomComplet||''} onChange={e=>update('nomComplet',e.target.value)} />
        </label>
        <label>
          Email
          <input type="email" value={form.email||''} onChange={e=>update('email',e.target.value)} />
        </label>
        <label>
          Rôle
          <select value={form.role} onChange={e=>update('role', e.target.value as UserRole)}>
            {roles.map(r=> <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label>
          Actif ?
          <select value={form.isActive? 'true':'false'} onChange={e=>update('isActive', e.target.value==='true')}>
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
        </label>
        <label>
          Matricule
          <input value={form.matricule||''} onChange={e=>update('matricule',e.target.value)} />
        </label>
        <div className="form-actions">
          <button type="submit" disabled={saving}>Sauvegarder</button>
          <button type="button" onClick={()=>navigate(-1)} className="secondary">Annuler</button>
        </div>
      </form>
    </div>
  )
}
