import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Web3Provider } from './context/Web3Context.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Web3Provider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Web3Provider>
  </StrictMode>,
)
