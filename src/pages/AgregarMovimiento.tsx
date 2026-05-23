import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, TrendingUp, TrendingDown, ArrowLeftRight, ArrowDown, Layers, Loader2 } from 'lucide-react'
import SelectorCuenta from '../components/forms/SelectorCuenta'
import SelectorCategoria from '../components/forms/SelectorCategoria'
import SelectorFecha from '../components/forms/SelectorFecha'
import { useCuentas } from '../hooks/useCuentas'
import { useCategorias } from '../hooks/useCategorias'
import { useCrearMovimiento } from '../hooks/useMovimientos'
import { movimientoSchema, type MovimientoFormData } from '../lib/schemas'
import type { TipoMovimiento } from '../types'
import { formatearDinero } from '../utils/formatters'
import { useCrearCompraCuotas } from '../hooks/useComprasCuotas'

export default function AgregarMovimiento() {
  const navigate = useNavigate()
  
  const { data: cuentas } = useCuentas()
  const { data: categorias } = useCategorias()
  
  // 🔍 DEBUG: Ver todas las cuentas
  console.log('📊 Todas las cuentas:', cuentas)
  console.log('📊 Longitud:', cuentas?.length)
  cuentas?.forEach(c => {
    console.log(`  - ${c.nombre}: archivada=${c.archivada}, tipo=${c.tipo}`)
  })
  
  const crearMovimientoMutation = useCrearMovimiento()
  const crearCompraCuotasMutation = useCrearCompraCuotas()
  
  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<MovimientoFormData>({
    resolver: zodResolver(movimientoSchema),
    defaultValues: {
      tipo: 'egreso',
      monto: 0,
      descripcion: '',
      fecha: new Date(),
      esCompraCuotas: false,
      tieneIntereses: false,
    },
  })
  
  const tipoActual = watch('tipo')
  const cuentaIdActual = watch('cuentaId')
  const cuentaDestinoIdActual = watch('cuentaDestinoId')
  const categoriaIdActual = watch('categoriaId')
  const esCompraCuotas = watch('esCompraCuotas')
  const tieneIntereses = watch('tieneIntereses')
  const numeroCuotas = watch('numeroCuotas')
  const monto = watch('monto')
  
  console.log('🎯 cuentaIdActual:', cuentaIdActual)
  console.log('🎯 cuentaDestinoIdActual:', cuentaDestinoIdActual)
  
  const cuentasActivas = cuentas?.filter((c) => c.archivada !== true) ?? []
  
  console.log('✅ Cuentas activas filtradas:', cuentasActivas.length)
  cuentasActivas.forEach(c => {
    console.log(`  ✓ ${c.nombre} (tipo: ${c.tipo})`)
  })
  
  const cuentaSeleccionada = cuentasActivas.find((c) => c.id === cuentaIdActual)
  const cuentaDestinoSeleccionada = cuentasActivas.find((c) => c.id === cuentaDestinoIdActual)
  const categoriaSeleccionada = categorias?.find((c) => c.id === categoriaIdActual)
  
  const tipoCategoria = tipoActual === 'ingreso' ? 'ingreso' : 'egreso'
  
  const puedeSerCuotas = tipoActual === 'egreso' && cuentaSeleccionada?.tipo === 'credito'
  
  const valorCuotaCalculado = !tieneIntereses && numeroCuotas && monto
    ? monto / numeroCuotas
    : 0
  
 const handleCambiarTipo = (nuevoTipo: TipoMovimiento) => {
    setValue('tipo', nuevoTipo)
    setValue('categoriaId', undefined)
    setValue('cuentaDestinoId', undefined)
    setValue('esCompraCuotas', false)
    setValue('numeroCuotas', undefined)
    setValue('valorCuota', undefined)
    setValue('tieneIntereses', false)
  }
  
  const handleCambiarCuenta = (cuentaId: string) => {
    setValue('cuentaId', cuentaId)
    const nuevaCuenta = cuentasActivas.find((c) => c.id === cuentaId)
    if (nuevaCuenta?.tipo !== 'credito') {
      setValue('esCompraCuotas', false)
    }
  }
  
  const onSubmit = async (datos: MovimientoFormData) => {
    try {
      if (datos.esCompraCuotas) {
        await crearCompraCuotasMutation.mutateAsync(datos)
      } else {
        await crearMovimientoMutation.mutateAsync(datos)
      }
      navigate(-1)
    } catch (err) {
      console.error('Error al crear movimiento:', err)
      alert('Hubo un problema al guardar el movimiento. Intenta de nuevo.')
    }
  }
  
  const getColorMonto = () => {
    if (tipoActual === 'ingreso') return 'text-emerald-600'
    if (tipoActual === 'egreso') return 'text-rose-600'
    return 'text-purple-600'
  }
  
  return (
    <div className="pb-6">
      
      {/* Header */}
      <header className="flex items-center gap-2 px-4 pt-6 pb-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">
          Nuevo movimiento
        </h1>
      </header>
      
      <form onSubmit={handleSubmit(onSubmit)} className="px-4 space-y-5">
        
        {/* Tabs de tipo */}
        <Controller
          control={control}
          name="tipo"
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-2xl">
              <button
                type="button"
                onClick={() => handleCambiarTipo('ingreso')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  field.value === 'ingreso'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
                Ingreso
              </button>
              <button
                type="button"
                onClick={() => handleCambiarTipo('egreso')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  field.value === 'egreso'
                    ? 'bg-white text-rose-600 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                <TrendingDown className="w-4 h-4" strokeWidth={2.5} />
                Egreso
              </button>
              <button
                type="button"
                onClick={() => handleCambiarTipo('transferencia')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  field.value === 'transferencia'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" strokeWidth={2.5} />
                Transfer.
              </button>
            </div>
          )}
        />
        
        {/* Input de monto destacado */}
        <div className="text-center py-2">
          <div className="flex items-center justify-center gap-1">
            <span className={`text-3xl font-bold ${getColorMonto()} opacity-50`}>$</span>
            <input
              type="number"
              step="any"
              {...register('monto', { valueAsNumber: true })}
              placeholder="0"
              className={`text-5xl font-bold ${getColorMonto()} bg-transparent text-center w-full max-w-[240px] focus:outline-none placeholder:text-gray-300`}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">pesos colombianos</p>
          {errors.monto && (
            <p className="text-xs text-rose-500 mt-1">{errors.monto.message}</p>
          )}
        </div>
        
        {/* Selector de cuenta origen */}
        <Controller
          control={control}
          name="cuentaId"
          render={() => (
            <div>
              <SelectorCuenta
                cuentas={cuentasActivas}
                cuentaSeleccionada={cuentaSeleccionada}
                onSelect={handleCambiarCuenta}
                label={tipoActual === 'transferencia' ? 'Desde' : 'Cuenta'}
                placeholder="Selecciona una cuenta"
              />
              {errors.cuentaId && (
                <p className="text-xs text-rose-500 mt-1">{errors.cuentaId.message}</p>
              )}
            </div>
          )}
        />
        
        {/* Indicador visual de transferencia */}
        {tipoActual === 'transferencia' && (
          <div className="flex justify-center -my-2">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <ArrowDown className="w-5 h-5 text-purple-500" strokeWidth={2.5} />
            </div>
          </div>
        )}
        
        {/* Selector de cuenta destino (solo transferencia) */}
        {tipoActual === 'transferencia' && (
          <Controller
            control={control}
            name="cuentaDestinoId"
            render={({ field }) => (
              <div>
                <SelectorCuenta
                  cuentas={cuentasActivas}
                  cuentaSeleccionada={cuentaDestinoSeleccionada}
                  onSelect={field.onChange}
                  label="Hacia"
                  placeholder="Selecciona la cuenta destino"
                  excluirId={cuentaIdActual}
                />
                {errors.cuentaDestinoId && (
                  <p className="text-xs text-rose-500 mt-1">{errors.cuentaDestinoId.message}</p>
                )}
              </div>
            )}
          />
        )}
        
        {/* Toggle de compra a cuotas */}
        {puedeSerCuotas && (
          <Controller
            control={control}
            name="esCompraCuotas"
            render={({ field }) => (
              <button
                type="button"
                onClick={() => field.onChange(!field.value)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  field.value
                    ? 'border-purple-400 bg-purple-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    field.value ? 'bg-purple-100' : 'bg-gray-100'
                  }`}>
                    <Layers className={`w-4 h-4 ${field.value ? 'text-purple-600' : 'text-gray-500'}`} strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${field.value ? 'text-purple-700' : 'text-gray-700'}`}>
                      Compra a cuotas
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Diferir el pago en varios meses
                    </p>
                  </div>
                </div>
                <div className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                  field.value ? 'bg-gradient-to-r from-purple-400 to-pink-400' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                    field.value ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </button>
            )}
          />
        )}
        
        {/* Campos extra para compra a cuotas */}
        {esCompraCuotas && (
          <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Número de cuotas
              </label>
              <input
                type="number"
                step="1"
                {...register('numeroCuotas', { valueAsNumber: true })}
                placeholder="Ej: 6"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition"
              />
              {errors.numeroCuotas && (
                <p className="text-xs text-rose-500 mt-1">{errors.numeroCuotas.message}</p>
              )}
            </div>
            
            <Controller
              control={control}
              name="tieneIntereses"
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    ¿Tiene intereses?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                        onClick={() => {
                      field.onChange(false)
                      setValue('valorCuota', undefined)
                        }}
                      className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        !field.value
                          ? 'border-purple-400 bg-white text-purple-700'
                          : 'border-gray-200 bg-white text-gray-500'
                      }`}
                    >
                      Sin intereses
                    </button>
                    <button
                      type="button"
                       onClick={() => {
                          field.onChange(true)
                        }}
                      className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        field.value
                          ? 'border-purple-400 bg-white text-purple-700'
                          : 'border-gray-200 bg-white text-gray-500'
                      }`}
                    >
                      Con intereses
                    </button>
                  </div>
                </div>
              )}
            />
            
            {tieneIntereses ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Valor de cada cuota
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                  <input
                    type="number"
                    step="any"
                    {...register('valorCuota', { valueAsNumber: true })}
                    placeholder="Lo que te dice el banco"
                    className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition"
                  />
                </div>
              </div>
            ) : valorCuotaCalculado > 0 && (
              <div className="bg-white rounded-xl p-3 border border-purple-100">
                <p className="text-[11px] font-medium text-purple-600 uppercase tracking-wide">
                  Valor cuota mensual
                </p>
                <p className="text-lg font-bold text-gray-800 mt-0.5">
                  {formatearDinero(valorCuotaCalculado)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  durante {numeroCuotas} meses
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Selector de categoría (no transferencia) */}
        {tipoActual !== 'transferencia' && categorias && (
          <Controller
            control={control}
            name="categoriaId"
            render={({ field }) => (
              <div>
                <SelectorCategoria
                  categorias={categorias}
                  categoriaSeleccionada={categoriaSeleccionada}
                  onSelect={field.onChange}
                  tipoFiltro={tipoCategoria}
                />
                {errors.categoriaId && (
                  <p className="text-xs text-rose-500 mt-1">{errors.categoriaId.message}</p>
                )}
              </div>
            )}
          />
        )}
        
        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Descripción
          </label>
          <input
            type="text"
            {...register('descripcion')}
            placeholder="Ej: Almuerzo con amigas"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent focus:bg-white transition"
          />
          {errors.descripcion && (
            <p className="text-xs text-rose-500 mt-1">{errors.descripcion.message}</p>
          )}
        </div>
        
        {/* Selector de fecha */}
        <Controller
          control={control}
          name="fecha"
          render={({ field }) => (
            <SelectorFecha
              fecha={field.value}
              onChange={field.onChange}
            />
          )}
        />
        
        {/* Botón de guardar */}
        <button
          type="submit"
         disabled={crearMovimientoMutation.isPending || crearCompraCuotasMutation.isPending}
          className="w-full py-3.5 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold rounded-xl shadow-lg shadow-purple-200 active:scale-[0.98] transition-all mt-6 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {(crearMovimientoMutation.isPending || crearCompraCuotasMutation.isPending) ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar movimiento'
          )}
        </button>
      </form>
    </div>
  )
}