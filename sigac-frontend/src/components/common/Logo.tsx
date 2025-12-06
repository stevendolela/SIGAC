import React from 'react'

type Props = {
  size?: number
  alt?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export default function Logo({ size = 48, alt = 'Taji Logo', style, onClick }: Props) {
  return (
    <img
      src="/taji-logo.png"
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
