import React from 'react'

type Props = {
  size?: number
  alt?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export default function Logo({ size = 48, alt = 'Taji Logo', style, onClick }: Props) {
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
      <defs>
        <linearGradient id="tajiGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="256" height="256" rx="24" fill="url(#tajiGradient)" />
      <text
        x="128"
        y="170"
        fontSize="140"
        fontWeight="bold"
        fill="white"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        letterSpacing="-2"
      >
        T
      </text>
    </svg>
  )
}
