import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { Cuenta } from '../types'
import { formatearDinero } from '../utils/formatters'
import { obtenerIcono } from '../utils/iconos'

interface AccountListItemProps {
  cuenta: Cuenta
}

export default function AccountListItem({ cuenta }: AccountListItemProps) {
  const navigate = useNavigate()
  
  const Icon = obtenerIcono(cuenta.icono)
  const esCredito = cuenta.tipo === 'credito'
  const cupoTotal = cuenta.cupoTotal ?? 0
  const cupoDisponible = cuenta.cupoDisponible ?? 0
  const deuda = cupoTotal - cupoDisponible
  const porcentajeUsado = cupoTotal > 0 ? (deuda / cupoTotal) * 100 : 0
  
  return (
    <button
      onClick={() => navigate(`/cuentas/${cuenta.id}`)}
      className="w-full bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md active:scale-[0.99] transition-all text-left"
    >
      <div className="flex items-center gap-3">
        
        {/* Ícono */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${cuenta.color}20` }}
        >
          <Icon
            className="w-6 h-6"
            style={{ color: cuenta.color }}
            strokeWidth={2.5}
          />
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">
            {cuenta.nombre}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {esCredito ? 'Tarjeta de crédito' : 'Cuenta de débito'}
          </p>
        </div>
        
        {/* Monto y flecha */}
        <div className="flex items-center gap-1">
          <div className="text-right">
            {esCredito ? (
              <>
                <p className="font-bold text-gray-800">
                  {formatearDinero(cupoDisponible)}
                </p>
                <p className="text-[10px] text-gray-400">
                  de {formatearDinero(cupoTotal)}
                </p>
              </>
            ) : (
              <p className="font-bold text-gray-800">
                {formatearDinero(cuenta.saldoActual)}
              </p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </div>
      </div>
      
      {/* Barra de progreso para tarjetas de crédito */}
      {esCredito && (
        <div className="mt-3">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${porcentajeUsado}%`,
                backgroundColor: cuenta.color,
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <p className="text-[10px] text-gray-400">
              {porcentajeUsado.toFixed(0)}% usado
            </p>
            <p className="text-[10px] text-gray-500 font-medium">
              Deuda: {formatearDinero(deuda)}
            </p>
          </div>
        </div>
      )}
    </button>
  )
}