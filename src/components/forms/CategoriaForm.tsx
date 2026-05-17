import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, TrendingUp, TrendingDown } from 'lucide-react'
import { categoriaSchema, type CategoriaFormData } from '../../lib/schemas'
import { COLORES_DISPONIBLES, ICONOS_CATEGORIAS } from '../../lib/constans'
import { obtenerIcono } from '../../utils/iconos'
import type { Categoria } from '../../types'

interface CategoriaFormProps {
  categoria?: Categoria
  tipoInicial?: 'ingreso' | 'egreso'
  onSubmit: (datos: CategoriaFormData) => void
  onCancel: () => void
}

export default function CategoriaForm({
  categoria,
  tipoInicial = 'egreso',
  onSubmit,
  onCancel,
}: CategoriaFormProps) {
  const esEdicion = !!categoria
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: categoria
      ? {
          nombre: categoria.nombre,
          tipo: categoria.tipo,
          color: categoria.color,
          icono: categoria.icono,
        }
      : {
          nombre: '',
          tipo: tipoInicial,
          color: COLORES_DISPONIBLES[0],
          icono: 'more-horizontal',
        },
  })
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
      
      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Nombre de la categoría
        </label>
        <input
          type="text"
          {...register('nombre')}
          placeholder="Ej: Mascotas, Gimnasio, etc."
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent focus:bg-white transition"
        />
        {errors.nombre && (
          <p className="text-xs text-rose-500 mt-1">{errors.nombre.message}</p>
        )}
      </div>
      
      {/* Tipo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Tipo
        </label>
        <Controller
          control={control}
          name="tipo"
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => field.onChange('ingreso')}
                className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  field.value === 'ingreso'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-white text-gray-600'
                }`}
              >
                <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
                Ingreso
              </button>
              <button
                type="button"
                onClick={() => field.onChange('egreso')}
                className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  field.value === 'egreso'
                    ? 'border-rose-400 bg-rose-50 text-rose-700'
                    : 'border-gray-200 bg-white text-gray-600'
                }`}
              >
                <TrendingDown className="w-4 h-4" strokeWidth={2.5} />
                Egreso
              </button>
            </div>
          )}
        />
      </div>

      {/* Selector de color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color
        </label>
        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <div className="grid grid-cols-6 gap-2">
              {COLORES_DISPONIBLES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => field.onChange(color)}
                  className="aspect-square rounded-xl flex items-center justify-center transition-all active:scale-90"
                  style={{
                    backgroundColor: color,
                    boxShadow: field.value === color ? `0 0 0 3px white, 0 0 0 5px ${color}` : 'none',
                  }}
                >
                  {field.value === color && (
                    <Check className="w-5 h-5 text-white" strokeWidth={3} />
                  )}
                </button>
              ))}
            </div>
          )}
        />
      </div>
      
      {/* Selector de ícono */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ícono
        </label>
        <Controller
          control={control}
          name="icono"
          render={({ field }) => (
            <div className="grid grid-cols-4 gap-2">
              {ICONOS_CATEGORIAS.map((iconoItem) => {
                const Icon = obtenerIcono(iconoItem.nombre)
                const seleccionado = field.value === iconoItem.nombre
                
                return (
                  <button
                    key={iconoItem.nombre}
                    type="button"
                    onClick={() => field.onChange(iconoItem.nombre)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all active:scale-95 ${
                      seleccionado
                        ? 'border-purple-400 bg-purple-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${seleccionado ? 'text-purple-600' : 'text-gray-500'}`}
                      strokeWidth={2.5}
                    />
                    <span className={`text-[9px] font-medium leading-tight text-center ${seleccionado ? 'text-purple-600' : 'text-gray-500'}`}>
                      {iconoItem.label}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        />
      </div>
      
      {/* Botones */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold rounded-xl shadow-lg shadow-purple-200 active:scale-[0.98] transition-all"
        >
          {esEdicion ? 'Guardar' : 'Crear'}
        </button>
      </div>
    </form>
  )
}
