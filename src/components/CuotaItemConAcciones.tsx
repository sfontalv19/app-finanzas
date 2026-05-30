import { useState } from 'react'
import { MoreVertical, Pencil, Trash2, CheckCircle2 } from 'lucide-react'
import CuotaItem from './CuotaItem'
import { formatearDinero } from '../utils/formatters'
import type { CompraCuotas, Cuenta } from '../types'

interface CuotaItemConAccionesProps {
  compra: CompraCuotas
  cuenta: Cuenta | undefined
  onPagar?: (compra: CompraCuotas) => void
  onEditar: (compra: CompraCuotas) => void
  onEliminar: (compra: CompraCuotas) => void
  mostrarBotonPagar?: boolean
}

/**
 * Envuelve un CuotaItem y le agrega menú de pagar/editar/eliminar.
 */
export default function CuotaItemConAcciones({
  compra,
  cuenta,
  onPagar,
  onEditar,
  onEliminar,
  mostrarBotonPagar = true,
}: CuotaItemConAccionesProps) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  
  const handleEliminarClick = () => {
    setMenuAbierto(false)
    
    const cuotasRestantes = compra.numeroCuotas - compra.cuotasPagadas
    const mensaje = compra.cuotasPagadas > 0
      ? `¿Eliminar "${compra.descripcion}"?\n\nYa pagaste ${compra.cuotasPagadas} cuotas (esas no se devolverán).\nSe devolverán al cupo ${formatearDinero(compra.valorCuota * cuotasRestantes)} de las ${cuotasRestantes} cuotas restantes.`
      : `¿Eliminar "${compra.descripcion}"?\n\nSe devolverá al cupo de la tarjeta ${formatearDinero(compra.montoTotal)}.`
    
    if (!confirm(mensaje)) return
    onEliminar(compra)
  }
  
  return (
    <div className="relative flex items-start gap-1">
      <div className="flex-1 min-w-0">
        <CuotaItem compra={compra} cuenta={cuenta} />
      </div>
      
      {/* Botón de menú (3 puntos) fuera del card */}
      <div className="pt-3 relative">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setMenuAbierto(!menuAbierto)
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all"
        >
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
        
        {/* Menú dropdown */}
        {menuAbierto && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuAbierto(false)}
            />
            <div className="absolute right-0 top-10 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20">
              {compra.activa && mostrarBotonPagar && onPagar && (
                <button
                  onClick={() => {
                    onPagar(compra)
                    setMenuAbierto(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-purple-600 hover:bg-purple-50 transition-colors font-medium"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Pagar cuota
                </button>
              )}
              <button
                onClick={() => {
                  onEditar(compra)
                  setMenuAbierto(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={handleEliminarClick}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
