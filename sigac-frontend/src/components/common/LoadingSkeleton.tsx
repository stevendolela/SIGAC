import React from 'react'

interface LoadingSkeletonProps {
  count?: number
  height?: number
  width?: string | number
  radius?: number
  className?: string
  style?: React.CSSProperties
}

// Composant skeleton simple avec animation shimmer
export function LoadingSkeleton({
  count = 1,
  height = 16,
  width = '100%',
  radius = 8,
  className = '',
  style = {}
}: LoadingSkeletonProps) {
  return (
    <div className={`skeleton-group ${className}`}> {
      Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            height,
            width,
            borderRadius: radius,
            marginBottom: 8,
            ...style
          }}
        />
      ))
    } </div>
  )
}

export function SkeletonTableRows({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <LoadingSkeleton height={14} width={c === 0 ? '60%' : '80%'} />
              </div>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}
