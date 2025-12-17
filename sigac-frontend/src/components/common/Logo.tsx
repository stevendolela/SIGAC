import React, { useState, useEffect } from 'react'

type Props = {
  size?: number
  alt?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export default function Logo({ size = 48, alt = 'Taji Logo', style, onClick }: Props) {
  const [customLogo, setCustomLogo] = useState<string | null>(null)

  useEffect(() => {
    // Charger le logo personnalisé du localStorage
    const loadLogo = () => {
      const logo = localStorage.getItem('customLogo')
      setCustomLogo(logo)
    }

    loadLogo()

    // Écouter les changements de logo (quand l'utilisateur upload un nouveau logo)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'customLogo') {
        setCustomLogo(e.newValue)
      }
    }

    // Écouter aussi un événement custom pour le même onglet
    const handleLogoUpdate = () => {
      loadLogo()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('logoUpdated', handleLogoUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('logoUpdated', handleLogoUpdate)
    }
  }, [])

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
