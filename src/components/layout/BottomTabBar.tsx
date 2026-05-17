import { NavLink } from 'react-router-dom'
import { Home, CreditCard, Plus, ArrowLeftRight, Menu } from 'lucide-react'

export default function BottomTabBar() {
  // Definición de los tabs
  const tabs = [
    { path: '/dashboard', label: 'Inicio', icon: Home },
    { path: '/cuentas', label: 'Cuentas', icon: CreditCard },
    { path: '/agregar', label: 'Agregar', icon: Plus, esCentral: true },
    { path: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
    { path: '/mas', label: 'Más', icon: Menu },
  ]
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] z-50">
      <div className="max-w-md mx-auto px-2">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon
            
            // Tab central destacado (botón de agregar)
            if (tab.esCentral) {
              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className="flex flex-col items-center justify-center -mt-6"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg shadow-purple-300 active:scale-95 transition-transform">
                    <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                </NavLink>
              )
            }
            
            // Tabs normales
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                    isActive ? 'text-purple-500' : 'text-gray-400 hover:text-gray-600'
                  }`
                }
              >
                <Icon className="w-5 h-5" strokeWidth={2} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </NavLink>
            )
          })}
        </div>
      </div>
    </nav>
  )
}