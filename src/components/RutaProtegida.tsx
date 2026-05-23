import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PantallaCarga from './ui/PantallaCarga'

export default function RutaProtegida() {
  const { usuario, cargando } = useAuth()
  
  // Mientras Firebase verifica si hay sesión, mostramos la carga
  if (cargando) {
    return <PantallaCarga />
  }
  
  // Si no hay usuario, redirigir a login
  if (!usuario) {
    return <Navigate to="/login" replace />
  }
  
  // Si hay usuario, renderizar las rutas hijas (Outlet)
  return <Outlet />
}