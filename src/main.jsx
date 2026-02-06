import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { FeaturesProvider } from './useFeatures.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FeaturesProvider>
      <App />
    </FeaturesProvider>
  </StrictMode>,
)