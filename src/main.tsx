import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'
import App from './App.tsx'

// Cliente de React Query con configuración por defecto
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // No refrescar automáticamente al volver a la pestaña (puedes activarlo después)
      refetchOnWindowFocus: false,
      // Cuánto tiempo los datos son "frescos" (no se vuelven a pedir)
      staleTime: 1000 * 60 * 5, // 5 minutos
      // Reintentos en caso de error
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)