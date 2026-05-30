import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Layers, Loader2, CheckCircle2, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import CuotaItem from '../components/CuotaItem'
import Modal from '../components/ui/Modal'
import PagarCuotaForm from '../components/forms/PagarCuotaForm'
import CompraCuotasForm from '../components/forms/CompraCuotasForm'
import { useCuentas } from '../hooks/useCuentas'
import { useCategorias } from '../hooks/useCategorias'
import {
  useComprasCuotas,
  usePagarCuota,
  useActualizarCompraCuotas,
  useEliminarCompraCuotas,
} from '../hooks/useComprasCuotas'
import { formatearDinero } from '../utils/formatters'
import { calcularCuotasDelMes } from '../utils/cuotas'
import type { CompraCuotas } from '../types'

type FiltroEstado = 'activas' | 'finalizadas' | 'todas'

export default function ComprasCuotas() {
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState<FiltroEstado>('activas')
  const [compraSeleccionada, setCompraSeleccionada] = useState<CompraCuotas | null>(null)
  const [compraEditando, setCompraEditando] = useState<CompraCuotas | null>(null)
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null)
  
  const { data: comprasCuotas, isLoading } = useComprasCuotas()
  const { data: cuentas } = useCuentas()
  const { data: categorias } = useCategorias()
  const pagarMutation = usePagarCuota()
  const actualizarMutation = useActualizarCompraCuotas()
  const eliminarMutation = useEliminarCompraCuotas()
  
  const comprasFiltradas = (comprasCuotas ?? []).filter((c) => {
    if (filtro === 'activas') return c.activa
    if (filtro === 'finalizadas') return !c.activa
    return true
  })
  
  const comprasOrdenadas = [...comprasFiltradas].sort(
    (a, b) => b.fechaCompra.getTime() - a.fechaCompra.getTime()
  )
  
  const comprasActivas = (comprasCuotas ?? []).filter((c) => c.activa)
  
  const ahora = new Date()
  const totalEsteMes = calcularCuotasDelMes(comprasActivas, ahora)
  
  // Próximos 3 meses
  const proximosMeses = [1, 2, 3].map((delta) => {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() + delta, 1)
    const total = calcularCuotasDelMes(comprasActivas, fecha)
    return {
      fecha,
      total,
      nombre: new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(fecha),
    }
  })
  
  // Deuda total restante
  const deudaTotalRestante = comprasActivas.reduce((total, compra) => {
    return total + (compra.valorCuota * compra.cuotasRestantes)
  }, 0)
  
  const handlePagar = async (cuentaPagoId: string) => {
    if (!compraSeleccionada) return
    
    try {
      await pagarMutation.mutateAsync({
        compraCuotas: compraSeleccionada,
        cuentaPagoId,
      })
      setCompraSeleccionada(null)
    } catch (err) {
      console.error('Error al pagar cuota:', err)
      const mensaje = err instanceof Error ? err.message : 'No se pudo registrar el pago.'
      alert(mensaje)
    }
  }
  
  const handleEditar = async (datos: {
    montoTotal: number
    numeroCuotas: number
    valorCuota?: number
    tieneIntereses: boolean
    categoriaId: string
    descripcion: string
  }) => {
    if (!compraEditando) return
    
    try {
      await actualizarMutation.mutateAsync({
        compraOriginal: compraEditando,
        datosNuevos: datos,
      })
      setCompraEditando(null)
    } catch (err) {
      console.error('Error al editar compra:', err)
      const mensaje = err instanceof Error ? err.message : 'No se pudo editar la compra.'
      alert(mensaje)
    }
  }
  
  const handleEliminar = async (compra: CompraCuotas) => {
    setMenuAbierto(null)
    
    const cuotasRestantes = compra.numeroCuotas - compra.cuotasPagadas
    const mensaje = compra.cuotasPagadas > 0
      ? `¿Eliminar "${compra.descripcion}"?\n\nYa pagaste ${compra.cuotasPagadas} cuotas (esas no se devolverán).\nSe devolverán al cupo ${formatearDinero(compra.valorCuota * cuotasRestantes)} de las ${cuotasRestantes} cuotas restantes.`
      : `¿Eliminar "${compra.descripcion}"?\n\nSe devolverá al cupo de la tarjeta ${formatearDinero(compra.montoTotal)}.`
    
    if (!confirm(mensaje)) return
    
    try {
      await eliminarMutation.mutateAsync(compra)
    } catch (err) {
      console.error('Error al eliminar compra:', err)
      const mensajeError = err instanceof Error ? err.message : 'No se pudo eliminar la compra.'
      alert(mensajeError)
    }
  }
  
  // Estado de carga
  if (isLoading) {
    return (
      <div className="px-4 pt-6 pb-4">
        <header className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Compras a cuotas</h1>
        </header>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      </div>
    )
  }
  
  return (
    <>
      <div className="px-4 pt-6 pb-4 space-y-5">
        
        {/* Header */}
        <header className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Compras a cuotas
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">
              {comprasActivas.length} {comprasActivas.length === 1 ? 'activa' : 'activas'}
            </p>
          </div>
        </header>
        
        {/* Card resumen */}
        {comprasActivas.length > 0 && (
          <div className="bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 rounded-2xl p-5 border border-pink-100">
            <p className="text-xs font-semibold text-pink-700 uppercase tracking-wide">
              Deuda total restante
            </p>
            <p className="text-3xl font-bold text-gray-800 mt-1">
              {formatearDinero(deudaTotalRestante)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              En {comprasActivas.length} compras activas
            </p>
            
            {/* Próximos meses */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-medium text-gray-500 uppercase">
                  Este mes
                </p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">
                  {formatearDinero(totalEsteMes)}
                </p>
              </div>
              {proximosMeses.slice(0, 2).map((mes) => (
                <div key={mes.nombre} className="bg-white/70 backdrop-blur-sm rounded-xl p-2.5 text-center">
                  <p className="text-[10px] font-medium text-gray-500 uppercase capitalize">
                    {mes.nombre}
                  </p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">
                    {formatearDinero(mes.total)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Tabs de filtro */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-2xl">
          <button
            onClick={() => setFiltro('activas')}
            className={`py-2 rounded-xl text-sm font-semibold transition-all ${
              filtro === 'activas'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Activas
          </button>
          <button
            onClick={() => setFiltro('finalizadas')}
            className={`py-2 rounded-xl text-sm font-semibold transition-all ${
              filtro === 'finalizadas'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Pagadas
          </button>
          <button
            onClick={() => setFiltro('todas')}
            className={`py-2 rounded-xl text-sm font-semibold transition-all ${
              filtro === 'todas'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Todas
          </button>
        </div>
        
        {/* Lista de compras */}
        {comprasOrdenadas.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-50 rounded-full mb-3">
              <Layers className="w-8 h-8 text-purple-400" strokeWidth={2} />
            </div>
            <p className="text-gray-600 font-medium">
              No hay compras {filtro === 'activas' ? 'activas' : filtro === 'finalizadas' ? 'finalizadas' : ''}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Registra una compra a cuotas desde el botón +
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {comprasOrdenadas.map((compra) => {
              const cuenta = cuentas?.find((c) => c.id === compra.cuentaId)
              return (
                <div key={compra.id} className="relative">
                  <CuotaItem compra={compra} cuenta={cuenta} />
                  
                  {/* Botones de acción */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {compra.activa && (
                      <button
                        onClick={() => setCompraSeleccionada(compra)}
                        className="px-2.5 py-1 bg-gradient-to-r from-purple-400 to-pink-400 text-white text-[10px] font-semibold rounded-full shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                        Pagar
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuAbierto(menuAbierto === compra.id ? null : compra.id)
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all bg-white"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  
                  {/* Menú dropdown */}
                  {menuAbierto === compra.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuAbierto(null)}
                      />
                      <div className="absolute right-2 top-12 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20">
                        <button
                          onClick={() => {
                            setCompraEditando(compra)
                            setMenuAbierto(null)
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(compra)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Modal de pagar cuota */}
      <Modal
        isOpen={!!compraSeleccionada}
        onClose={() => setCompraSeleccionada(null)}
        title="Pagar cuota"
      >
        {compraSeleccionada && (
          <PagarCuotaForm
            compra={compraSeleccionada}
            cuentas={cuentas ?? []}
            onSubmit={handlePagar}
            onCancel={() => setCompraSeleccionada(null)}
            cargando={pagarMutation.isPending}
          />
        )}
      </Modal>
      
      {/* Modal de editar compra a cuotas */}
      <Modal
        isOpen={!!compraEditando}
        onClose={() => setCompraEditando(null)}
        title="Editar compra a cuotas"
      >
        {compraEditando && categorias && (
          <CompraCuotasForm
            compra={compraEditando}
            categorias={categorias}
            onSubmit={handleEditar}
            onCancel={() => setCompraEditando(null)}
            cargando={actualizarMutation.isPending}
          />
        )}
      </Modal>
    </>
  )
}