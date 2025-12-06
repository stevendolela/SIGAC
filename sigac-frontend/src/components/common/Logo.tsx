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
    const logo = localStorage.getItem('customLogo')
    setCustomLogo(logo)
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
