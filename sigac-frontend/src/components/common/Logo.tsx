import React, { useState } from 'react'

type Props = {
  size?: number
  alt?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export default function Logo({ size = 48, alt = 'Taji Logo', style, onClick }: Props) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    // Fallback SVG inline si le PNG ne charge pas
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 256 256"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        onClick={onClick}
        style={{
          width: size,
          height: size,
          ...style
        }}
      >
        <rect width="256" height="256" fill="#667eea" rx="24" />
        <text
          x="128"
          y="140"
          fontSize="120"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
        >
          T
        </text>
      </svg>
    )
  }

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
      onError={() => setHasError(true)}
    />
  )
}
