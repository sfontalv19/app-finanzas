import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Layers, Loader2, CheckCircle2 } from 'lucide-react'
import CuotaItem from '../components/CuotaItem'
import Modal from '../components/ui/Modal'
import PagarCuotaForm from '../components/forms/PagarCuotaForm'
import { useCuentas } from '../hooks/useCuentas'
import { useComprasCuotas, usePagarCuota } from '../hooks/useComprasCuotas'
import { formatearDinero } from '../utils/formatters'
import { calcularCuotasDelMes } from '../utils/cuotas'
import type { CompraCuotas } from '../types'

type FiltroEstado = 'activas' | 'finalizadas' | 'todas'

export default function ComprasCuotas() {
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState<FiltroEstado>('activas')
  const [compraSeleccionada, setCompraSeleccionada] = useState<CompraCuotas | null>(null)
  
  const { data: comprasCuotas, isLoading } = useComprasCuotas()
  const { data: cuentas } = useCuentas()
  const pagarMutation = usePagarCuota()
  
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
      alert('No se pudo registrar el pago. Intenta de nuevo.')
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
                  {compra.activa && (
                    <button
                      onClick={() => setCompraSeleccionada(compra)}
                      className="absolute top-3 right-3 px-2.5 py-1 bg-gradient-to-r from-purple-400 to-pink-400 text-white text-[10px] font-semibold rounded-full shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                      Pagar
                    </button>
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
    </>
  )
}