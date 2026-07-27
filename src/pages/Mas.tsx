import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Tag, Layers, User, LogOut, Bell, HelpCircle, Sparkles, Loader2, Calendar } from 'lucide-react'
import { cerrarSesion } from '../services/authService'
import { useAuth } from '../contexts/AuthContext'

interface MenuItemProps {
  to?: string
  onClick?: () => void
  icon: React.ReactNode
  label: string
  description?: string
  iconBg: string
  iconColor: string
  danger?: boolean
}

function MenuItem({ to, onClick, icon, label, description, iconBg, iconColor, danger }: MenuItemProps) {
  const content = (
    <div className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <div style={{ color: iconColor }}>{icon}</div>
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className={`text-sm font-semibold ${danger ? 'text-rose-600' : 'text-gray-800'}`}>
          {label}
        </p>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      {!danger && <ChevronRight className="w-4 h-4 text-gray-300" />}
    </div>
  )
  
  if (to) {
    return <Link to={to}>{content}</Link>
  }
  
  return <button onClick={onClick} className="w-full">{content}</button>
}

export default function Mas() {
  const { usuario } = useAuth()
  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  
  const handleCerrarSesion = async () => {
    if (!confirm('¿Estás segura de cerrar sesión?')) return
    
    setCerrandoSesion(true)
    try {
      await cerrarSesion()
      // No necesitamos navegar manualmente, RutaProtegida lo hace
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
      alert('Hubo un problema al cerrar sesión. Intenta de nuevo.')
      setCerrandoSesion(false)
    }
  }
  
  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-gray-800">
          Más opciones
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Personaliza tu experiencia
        </p>
      </header>
      
      {/* Card de perfil */}
      <div className="bg-gradient-to-br from-purple-400 via-purple-400 to-pink-400 rounded-3xl p-5 shadow-lg shadow-purple-200 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-12 -left-8 w-32 h-32 bg-white/10 rounded-full" />
        
        <div className="relative flex items-center gap-3">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <User className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-lg">
              {usuario?.displayName ?? 'Mi Cuenta'}
            </p>

            <p className="text-white/80 text-sm truncate">
            {usuario?.email ?? 'Gestiona tu perfil'}
            </p>
          </div>
          <Sparkles className="w-5 h-5 text-white/60" />
        </div>
      </div>
      
      {/* Sección: Datos */}
      <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
        <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          Mis datos
        </p>
        <MenuItem
          to="/categorias"
          icon={<Tag className="w-5 h-5" strokeWidth={2.5} />}
          label="Categorías"
          description="Personaliza tus categorías de gastos e ingresos"
          iconBg="#F9A8D420"
          iconColor="#EC4899"
        />
        <MenuItem
          to="/compras-cuotas"
          icon={<Layers className="w-5 h-5" strokeWidth={2.5} />}
          label="Compras a cuotas"
          description="Gestiona tus pagos diferidos"
          iconBg="#A78BFA20"
          iconColor="#8B5CF6"
        />
        <MenuItem
          to="/historial"
          icon={<Calendar className="w-5 h-5" strokeWidth={2.5} />}
          label="Historial mensual"
          description="Consulta tus ingresos y egresos por mes"
          iconBg="#86EFAC20"
          iconColor="#10B981"
        />
      </section>
      
      {/* Sección: Cuenta */}
      <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
        <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          Configuración
        </p>
        <MenuItem
          icon={<Bell className="w-5 h-5" strokeWidth={2.5} />}
          label="Notificaciones"
          description="Próximamente"
          iconBg="#FCD34D20"
          iconColor="#F59E0B"
          onClick={() => alert('Próximamente')}
        />
        <MenuItem
          icon={<HelpCircle className="w-5 h-5" strokeWidth={2.5} />}
          label="Ayuda y soporte"
          iconBg="#7DD3FC20"
          iconColor="#0EA5E9"
          onClick={() => alert('Próximamente')}
        />
      </section>
      
      {/* Cerrar sesión */}
      <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
       <MenuItem
        icon={
          cerrandoSesion ? (
            <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
          ) : (
            <LogOut className="w-5 h-5" strokeWidth={2.5} />
          )
        }
        label={cerrandoSesion ? 'Cerrando sesión...' : 'Cerrar sesión'}
        iconBg="#FCA5A520"
        iconColor="#EF4444"
        onClick={handleCerrarSesion}
        danger
      />
      </section>
      
      {/* Versión */}
      <p className="text-center text-xs text-gray-400 pt-2">
        Versión 1.0.0 · Hecho con 💜
      </p>
    </div>
  )
}

