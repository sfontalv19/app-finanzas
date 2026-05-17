import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'
import type { Cuenta } from '../../types'
import { obtenerIcono } from '../../utils/iconos'
import { formatearDinero } from '../../utils/formatters'

interface SelectorCuentaProps {
  cuentas: Cuenta[]
  cuentaSeleccionada: Cuenta | undefined
  onSelect: (cuentaId: string) => void
  label?: string
  placeholder?: string
  excluirId?: string
}

export default function SelectorCuenta({
  cuentas,
  cuentaSeleccionada,
  onSelect,
  label = 'Cuenta',
  placeholder = 'Selecciona una cuenta',
  excluirId,
}: SelectorCuentaProps) {
  const [abierto, setAbierto] = useState(false)
  
  // Filtrar cuenta a excluir (útil para transferencias)
  const cuentasDisponibles = cuentas.filter(
    (c) => !c.archivada && c.id !== excluirId
  )
  
  const handleSelect = (cuentaId: string) => {
    onSelect(cuentaId)
    setAbierto(false)
  }
  
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 active:scale-[0.99] transition-all"
        >
          {cuentaSeleccionada ? (
            <>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${cuentaSeleccionada.color}20` }}
              >
                {(() => {
                  const Icon = obtenerIcono(cuentaSeleccionada.icono)
                  return (
                    <Icon
                      className="w-4 h-4"
                      style={{ color: cuentaSeleccionada.color }}
                      strokeWidth={2.5}
                    />
                  )
                })()}
              </div>
              <span className="flex-1 text-left text-gray-800 font-medium">
                {cuentaSeleccionada.nombre}
              </span>
            </>
          ) : (
            <span className="flex-1 text-left text-gray-400">
              {placeholder}
            </span>
          )}
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      
      <BottomSheet
        isOpen={abierto}
        onClose={() => setAbierto(false)}
        title={label}
      >
        <div className="p-3 space-y-1">
          {cuentasDisponibles.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">
              No hay cuentas disponibles
            </p>
          ) : (
            cuentasDisponibles.map((cuenta) => {
              const Icon = obtenerIcono(cuenta.icono)
              const seleccionada = cuentaSeleccionada?.id === cuenta.id
              const monto = cuenta.tipo === 'credito'
                ? cuenta.cupoDisponible ?? 0
                : cuenta.saldoActual
              
              return (
                <button
                  key={cuenta.id}
                  type="button"
                  onClick={() => handleSelect(cuenta.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                    seleccionada ? 'bg-purple-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${cuenta.color}20` }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: cuenta.color }}
                      strokeWidth={2.5}
                    />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-gray-800 truncate text-sm">
                      {cuenta.nombre}
                    </p>
                    <p className="text-xs text-gray-500">
                      {cuenta.tipo === 'credito' ? 'Disponible: ' : 'Saldo: '}
                      {formatearDinero(monto)}
                    </p>
                  </div>
                  {seleccionada && (
                    <Check className="w-5 h-5 text-purple-500" strokeWidth={3} />
                  )}
                </button>
              )
            })
          )}
        </div>
      </BottomSheet>
    </>
  )
}