import { Outlet } from 'react-router-dom'
import BottomTabBar from './BottomTabBar'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Contenido de la pantalla actual */}
      <main className="pb-20 max-w-md mx-auto">
        <Outlet />
      </main>
      
      {/* Barra inferior fija */}
      <BottomTabBar />
    </div>
  )
}