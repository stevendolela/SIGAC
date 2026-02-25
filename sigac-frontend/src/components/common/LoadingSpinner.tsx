import { RefreshCw } from 'lucide-react'
import './LoadingSpinner.css'

interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  fullPage?: boolean
}

export default function LoadingSpinner({ 
  message = 'Chargement...', 
  size = 'md',
  fullPage = false 
}: LoadingSpinnerProps) {
  const iconSize = size === 'sm' ? 20 : size === 'md' ? 32 : 48
  
  return (
    <div className={`loading-spinner ${fullPage ? 'full-page' : ''}`}>
      <RefreshCw size={iconSize} className="spinner-icon" />
      {message && <p className="spinner-message">{message}</p>}
    </div>
  )
}
