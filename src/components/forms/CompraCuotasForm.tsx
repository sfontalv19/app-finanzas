import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import SelectorCategoria from './SelectorCategoria'
import InputMonto from '../ui/InputMonto'
import { formatearDinero } from '../../utils/formatters'
import type { CompraCuotas, Categoria } from '../../types'

interface CompraCuotasFormProps {
  compra: CompraCuotas
  categorias: Categoria[]
  onSubmit: (datos: {
    montoTotal: number
    numeroCuotas: number
    valorCuota?: number
    tieneIntereses: boolean
    categoriaId: string
    descripcion: string
  }) => void
  onCancel: () => void
  cargando: boolean
}

export default function CompraCuotasForm({
  compra,
  categorias,
  onSubmit,
  onCancel,
  cargando,
}: CompraCuotasFormProps) {
  const [montoTotal, setMontoTotal] = useState<number | undefined>(compra.montoTotal)
  const [numeroCuotas, setNumeroCuotas] = useState<number>(compra.numeroCuotas)
  const [tieneIntereses, setTieneIntereses] = useState<boolean>(compra.tieneIntereses)
  const [valorCuota, setValorCuota] = useState<number | undefined>(compra.valorCuota)
  const [categoriaId, setCategoriaId] = useState<string>(compra.categoriaId)
  const [descripcion, setDescripcion] = useState<string>(compra.descripcion)
  
  const categoriaSeleccionada = categorias.find((c) => c.id === categoriaId)
  
  const valorCuotaCalculado = !tieneIntereses && numeroCuotas && montoTotal
    ? Math.round(montoTotal / numeroCuotas)
    : 0
  
  // Limpiar valorCuota cuando se cambia a "sin intereses"
  useEffect(() => {
    if (!tieneIntereses) {
      setValorCuota(undefined)
    }
  }, [tieneIntereses])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!montoTotal || montoTotal <= 0) {
      alert('Ingresa un monto válido')
      return
    }
    if (!numeroCuotas || numeroCuotas < 1) {
      alert('Mínimo 1 cuota')
      return
    }
    if (!categoriaId) {
      alert('Selecciona una categoría')
      return
    }
    if (!descripcion.trim()) {
      alert('Agrega una descripción')
      return
    }
    if (tieneIntereses && (!valorCuota || valorCuota <= 0)) {
      alert('Ingresa el valor de la cuota')
      return
    }
    
    onSubmit({
      montoTotal,
      numeroCuotas,
      valorCuota: tieneIntereses ? valorCuota : undefined,
      tieneIntereses,
      categoriaId,
      descripcion: descripcion.trim(),
    })
  }
  
  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      
      {/* Info de cuotas pagadas */}
      {compra.cuotasPagadas > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
          <p className="text-[11px] text-amber-700 leading-relaxed">
            <strong>Ya pagaste {compra.cuotasPagadas} cuotas.</strong> Esos pagos no se modifican, pero el resto sí se ajustará al nuevo plan.
          </p>
        </div>
      )}
      
      {/* Monto total */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Monto total
        </label>
        <InputMonto
          value={montoTotal}
          onChange={setMontoTotal}
          placeholder="0"
        />
      </div>
      
      {/* Número de cuotas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Número de cuotas
        </label>
        <input
          type="number"
          step="1"
          min="1"
          max="48"
          value={numeroCuotas || ''}
          onChange={(e) => setNumeroCuotas(parseInt(e.target.value) || 0)}
          placeholder="Ej: 6 (mínimo 1)"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent focus:bg-white transition"
        />
      </div>
      
      {/* Tiene intereses */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          ¿Tiene intereses?
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTieneIntereses(false)}
            className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
              !tieneIntereses
                ? 'border-purple-400 bg-white text-purple-700'
                : 'border-gray-200 bg-white text-gray-500'
            }`}
          >
            Sin intereses
          </button>
          <button
            type="button"
            onClick={() => setTieneIntereses(true)}
            className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
              tieneIntereses
                ? 'border-purple-400 bg-white text-purple-700'
                : 'border-gray-200 bg-white text-gray-500'
            }`}
          >
            Con intereses
          </button>
        </div>
      </div>
      
      {/* Valor de cuota o cálculo automático */}
      {tieneIntereses ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Valor de cada cuota
          </label>
          <InputMonto
            value={valorCuota}
            onChange={setValorCuota}
            placeholder="Lo que te dice el banco"
          />
        </div>
      ) : valorCuotaCalculado > 0 && (
        <div className="bg-purple-50/50 rounded-xl p-3 border border-purple-100">
          <p className="text-[11px] font-medium text-purple-600 uppercase tracking-wide">
            Valor cuota
          </p>
          <p className="text-lg font-bold text-gray-800 mt-0.5">
            {formatearDinero(valorCuotaCalculado)}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {numeroCuotas === 1 ? 'pago único' : `durante ${numeroCuotas} meses`}
          </p>
        </div>
      )}
      
      {/* Categoría */}
      <SelectorCategoria
        categorias={categorias}
        categoriaSeleccionada={categoriaSeleccionada}
        onSelect={setCategoriaId}
        tipoFiltro="egreso"
      />
      
      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Descripción
        </label>
        <input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Ej: Zapatos"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent focus:bg-white transition"
        />
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
          disabled={cargando}
          className="flex-1 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold rounded-xl shadow-lg shadow-purple-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {cargando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar cambios'
          )}
        </button>
      </div>
    </form>
  )
}
