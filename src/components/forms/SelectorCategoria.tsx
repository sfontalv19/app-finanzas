import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'
import type { Categoria, TipoCategoria } from '../../types'
import { obtenerIcono } from '../../utils/iconos'

interface SelectorCategoriaProps {
  categorias: Categoria[]
  categoriaSeleccionada: Categoria | undefined
  onSelect: (categoriaId: string) => void
  tipoFiltro: TipoCategoria
}

export default function SelectorCategoria({
  categorias,
  categoriaSeleccionada,
  onSelect,
  tipoFiltro,
}: SelectorCategoriaProps) {
  const [abierto, setAbierto] = useState(false)
  
  const categoriasFiltradas = categorias.filter((c) => c.tipo === tipoFiltro)
  
  const handleSelect = (categoriaId: string) => {
    onSelect(categoriaId)
    setAbierto(false)
  }
  
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Categoría
        </label>
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 active:scale-[0.99] transition-all"
        >
          {categoriaSeleccionada ? (
            <>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${categoriaSeleccionada.color}20` }}
              >
                {(() => {
                  const Icon = obtenerIcono(categoriaSeleccionada.icono)
                  return (
                    <Icon
                      className="w-4 h-4"
                      style={{ color: categoriaSeleccionada.color }}
                      strokeWidth={2.5}
                    />
                  )
                })()}
              </div>
              <span className="flex-1 text-left text-gray-800 font-medium">
                {categoriaSeleccionada.nombre}
              </span>
            </>
          ) : (
            <span className="flex-1 text-left text-gray-400">
              Selecciona una categoría
            </span>
          )}
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      
      <BottomSheet
        isOpen={abierto}
        onClose={() => setAbierto(false)}
        title="Categoría"
      >
        <div className="p-3 grid grid-cols-3 gap-2">
          {categoriasFiltradas.map((categoria) => {
            const Icon = obtenerIcono(categoria.icono)
            const seleccionada = categoriaSeleccionada?.id === categoria.id
            
            return (
              <button
                key={categoria.id}
                type="button"
                onClick={() => handleSelect(categoria.id)}
                className={`relative aspect-square flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 transition-all active:scale-95 ${
                  seleccionada
                    ? 'border-purple-400 bg-purple-50'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${categoria.color}20` }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: categoria.color }}
                    strokeWidth={2.5}
                  />
                </div>
                <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">
                  {categoria.nombre}
                </span>
                {seleccionada && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-purple-400 rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </BottomSheet>
    </>
  )
}