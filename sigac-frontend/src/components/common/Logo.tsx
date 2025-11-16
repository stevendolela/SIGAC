import React, { useState } from 'react'
import svgFallback from '../../assets/taji-logo.svg'

type Props = {
  size?: number
  alt?: string
  style?: React.CSSProperties
  onClick?: () => void
}

/**
 * Logo qui tente d'utiliser le PNG officiel dans /public/taji-logo.png,
 * et bascule automatiquement sur le SVG fallback si le PNG est introuvable.
 */
export default function Logo({ size = 48, alt = 'Taji Logo', style, onClick }: Props) {
  const [src, setSrc] = useState<string>('/taji-logo.png')

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain', ...style }}
      onClick={onClick}
      onError={() => setSrc(svgFallback)}
    />
  )
}
