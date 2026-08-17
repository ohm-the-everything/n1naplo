import { Capacitor } from '@capacitor/core'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/globals.css'

async function initNative() {
  if (!Capacitor.isNativePlatform()) return

  const { App: CapApp } = await import('@capacitor/app')
  const { StatusBar, Style } = await import('@capacitor/status-bar')

  StatusBar.setStyle({ style: Style.Light }).catch(() => {})
  StatusBar.setBackgroundColor({ color: '#FAF6EF' }).catch(() => {})

  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else {
      CapApp.exitApp()
    }
  })
}

initNative()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
