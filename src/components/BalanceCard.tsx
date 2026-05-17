import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatearDinero } from '../utils/formatters'

interface BalanceCardProps {
  balanceTotal: number
  ingresosMes: number
  egresosMes: number
}

export default function BalanceCard({
  balanceTotal,
  ingresosMes,
  egresosMes,
}: BalanceCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-400 via-purple-400 to-pink-400 p-6 shadow-xl shadow-purple-200">
      
      {/* Decoración de fondo (círculos sutiles) */}
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
      <div className="absolute -bottom-12 -left-8 w-32 h-32 bg-white/10 rounded-full" />
      
      {/* Contenido */}
      <div className="relative">
        <p className="text-white/80 text-sm font-medium">Balance total</p>
        <p className="text-white text-4xl font-bold mt-1 tracking-tight">
          {formatearDinero(balanceTotal)}
        </p>
        
        {/* Ingresos y egresos */}
        <div className="flex gap-3 mt-6">
          <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-white/90">
              <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-medium">Ingresos</span>
            </div>
            <p className="text-white text-lg font-bold mt-1.5">
              {formatearDinero(ingresosMes)}
            </p>
          </div>
          
          <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-white/90">
              <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingDown className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-medium">Egresos</span>
            </div>
            <p className="text-white text-lg font-bold mt-1.5">
              {formatearDinero(egresosMes)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}