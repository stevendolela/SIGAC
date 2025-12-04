import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import './styles.css'
import { ToastProvider } from './components/common/ToastProvider'

// Cacher le loading screen après que React soit monté
// Garder le loading screen jusqu'à ce que l'app soit prête
const hideLoadingScreen = () => {
  const loadingScreen = document.getElementById('loading-screen')
  if (loadingScreen) {
    loadingScreen.classList.add('hidden')
  }
}

// Attendre un peu avant de masquer pour éviter un flash
setTimeout(hideLoadingScreen, 800)

// Exposer la fonction globalement pour que l'app puisse l'appeler après le login
declare global {
  interface Window {
    hideLoadingScreen: typeof hideLoadingScreen
  }
}
window.hideLoadingScreen = hideLoadingScreen

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
)
