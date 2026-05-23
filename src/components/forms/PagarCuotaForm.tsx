import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import SelectorCuenta from './SelectorCuenta'
import { formatearDinero } from '../../utils/formatters'
import type { CompraCuotas, Cuenta } from '../../types'

interface PagarCuotaFormProps {
  compra: CompraCuotas
  cuentas: Cuenta[]
  onSubmit: (cuentaPagoId: string) => void
  onCancel: () => void
  cargando: boolean
}

export default function PagarCuotaForm({
  compra,
  cuentas,
  onSubmit,
  onCancel,
  cargando,
}: PagarCuotaFormProps) {
  const [cuentaPagoId, setCuentaPagoId] = useState<string>('')
  
  // Filtrar solo cuentas de débito (no tiene sentido pagar tarjeta con otra tarjeta)
  const cuentasDisponibles = cuentas.filter((c) => !c.archivada && c.tipo === 'debito')
  
  const cuentaSeleccionada = cuentasDisponibles.find((c) => c.id === cuentaPagoId)
  
  const cuotaActual = compra.cuotasPagadas + 1
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cuentaPagoId) return
    onSubmit(cuentaPagoId)
  }
  
  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-5">
      
      {/* Info de la compra */}
      <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
          Pagando cuota {cuotaActual} de {compra.numeroCuotas}
        </p>
        <p className="text-lg font-bold text-gray-800 mt-1 truncate">
          {compra.descripcion}
        </p>
        <p className="text-2xl font-bold text-gray-800 mt-2">
          {formatearDinero(compra.valorCuota)}
        </p>
        <p className="text-[11px] text-gray-500 mt-1">
          Quedarán {compra.cuotasRestantes - 1} cuotas después de este pago
        </p>
      </div>
      
      {/* Selector de cuenta de pago */}
      <div>
        <SelectorCuenta
          cuentas={cuentasDisponibles}
          cuentaSeleccionada={cuentaSeleccionada}
          onSelect={setCuentaPagoId}
          label="Pagar desde"
          placeholder="Selecciona la cuenta"
        />
        {cuentasDisponibles.length === 0 && (
          <p className="text-xs text-rose-500 mt-1">
            No tienes cuentas de débito para pagar
          </p>
        )}
      </div>
      
      {/* Nota informativa */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5">
        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-blue-600 text-xs font-bold">i</span>
        </div>
        <p className="text-[11px] text-blue-700/80 leading-relaxed">
          Esto registrará un egreso en la cuenta seleccionada y liberará cupo en la tarjeta de crédito.
        </p>
      </div>
      
      {/* Botones */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={cargando}
          className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!cuentaPagoId || cargando}
          className="flex-1 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold rounded-xl shadow-lg shadow-purple-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {cargando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Pagando...
            </>
          ) : (
            'Pagar cuota'
          )}
        </button>
      </div>
    </form>
  )
}