import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PantallaCarga from './ui/PantallaCarga'

export default function RutaPublica() {
  const { usuario, cargando } = useAuth()
  
  // Mientras verifica, mostrar carga
  if (cargando) {
    return <PantallaCarga />
  }
  
  // Si YA hay usuario, redirigir al dashboard (no debería ver login/registro)
  if (usuario) {
    return <Navigate to="/dashboard" replace />
  }
  
  // Si NO hay usuario, mostrar la ruta (login o registro)
  return <Outlet />
}