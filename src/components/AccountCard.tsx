import { useNavigate } from 'react-router-dom'
import type { Cuenta } from '../types'
import { formatearDinero } from '../utils/formatters'
import { obtenerIcono } from '../utils/iconos'

interface AccountCardProps {
  cuenta: Cuenta
}

export default function AccountCard({ cuenta }: AccountCardProps) {
  const navigate = useNavigate()
  
  const Icon = obtenerIcono(cuenta.icono)
  
  const esCredito = cuenta.tipo === 'credito'
  const cupoDisponible = cuenta.cupoDisponible ?? 0
  const cupoTotal = cuenta.cupoTotal ?? 0
  const deuda = cupoTotal - cupoDisponible
  const porcentajeUsado = cupoTotal > 0 ? (deuda / cupoTotal) * 100 : 0
  
  return (
    <button
      onClick={() => navigate(`/cuentas/${cuenta.id}`)}
      className="flex-shrink-0 w-44 text-left rounded-2xl p-4 border border-gray-100 bg-white hover:shadow-lg active:scale-[0.98] transition-all"
      style={{
        boxShadow: `0 4px 14px -4px ${cuenta.color}40`,
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: `${cuenta.color}20` }}
      >
        <Icon className="w-5 h-5" style={{ color: cuenta.color }} strokeWidth={2.5} />
      </div>
      
      <p className="text-xs font-medium text-gray-500 truncate">
        {cuenta.nombre}
      </p>
      
      {esCredito ? (
        <>
          <p className="text-lg font-bold text-gray-800 mt-0.5">
            {formatearDinero(cupoDisponible)}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            disponible de {formatearDinero(cupoTotal)}
          </p>
          
          <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${porcentajeUsado}%`,
                backgroundColor: cuenta.color,
              }}
            />
          </div>
        </>
      ) : (
        <>
          <p className="text-lg font-bold text-gray-800 mt-0.5">
            {formatearDinero(cuenta.saldoActual)}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            saldo disponible
          </p>
        </>
      )}
    </button>
  )
}