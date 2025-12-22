import React, { useState, useEffect } from 'react'

type Props = {
  size?: number
  alt?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export default function Logo({ size = 48, alt = 'Taji Logo', style, onClick }: Props) {
  const [customLogo, setCustomLogo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Charger le logo depuis l'API
    const loadLogo = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://sigac-api.onrender.com/api'}/system/logo`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setCustomLogo(data.logoBase64)
        }
      } catch (error) {
        console.error('Erreur chargement logo:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLogo()

    // Écouter les mises à jour du logo
    const handleLogoUpdate = () => {
      loadLogo()
    }

    window.addEventListener('logoUpdated', handleLogoUpdate)

    return () => {
      window.removeEventListener('logoUpdated', handleLogoUpdate)
    }
  }, [])

  if (loading) {
    return <div style={{ width: size, height: size }} />
  }

  const logoSrc = customLogo || '/taji-logo.png'

  return (
    <img
      src={logoSrc}
      alt={alt}
      width={size}
      height={size}
      style={{ 
        width: size, 
        height: size, 
        objectFit: 'contain',
        ...style 
      }}
      onClick={onClick}
    />
  )
}
