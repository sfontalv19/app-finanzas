import { CreditCard } from 'lucide-react'
import type { CompraCuotas, Cuenta } from '../types'
import { formatearDinero } from '../utils/formatters'

interface CuotaItemProps {
  compra: CompraCuotas
  cuenta: Cuenta | undefined
}

export default function CuotaItem({ compra, cuenta }: CuotaItemProps) {
  // Calcular qué cuota es la próxima a pagar
  const cuotaActual = compra.cuotasPagadas + 1
  const porcentajePagado = (compra.cuotasPagadas / compra.numeroCuotas) * 100
  
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100">
      <div className="flex items-start gap-3">
        
        {/* Ícono */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${cuenta?.color ?? '#A78BFA'}20` }}
        >
          <CreditCard
            className="w-5 h-5"
            style={{ color: cuenta?.color ?? '#A78BFA' }}
            strokeWidth={2.5}
          />
        </div>
        
        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 truncate">
                {compra.descripcion}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {cuenta?.nombre ?? 'Tarjeta'} · Cuota {cuotaActual} de {compra.numeroCuotas}
                {compra.tieneIntereses && ' · con intereses'}
              </p>
            </div>
            <p className="font-bold text-gray-800 whitespace-nowrap">
              {formatearDinero(compra.valorCuota)}
            </p>
          </div>
          
          {/* Barra de progreso */}
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all"
              style={{ width: `${porcentajePagado}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            {compra.cuotasPagadas} pagadas · {compra.cuotasRestantes} restantes
          </p>
        </div>
      </div>
    </div>
  )
}