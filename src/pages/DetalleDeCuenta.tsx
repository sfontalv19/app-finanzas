import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, MoreVertical, Pencil, Archive, TrendingUp, TrendingDown } from 'lucide-react'
import MovimientoItem from '../components/MovimientoItem'
import CuotaItem from '../components/CuotaItem'
import Modal from '../components/ui/Modal'
import CuentaForm from '../components/forms/CuentaForm'
import { cuentasMock, movimientosMock, comprasCuotasMock, categoriasMock } from '../lib/mockData'
import { formatearDinero } from '../utils/formatters'
import { obtenerIcono } from '../utils/iconos'
import type { CuentaFormData } from '../lib/schemas'

export default function DetalleCuenta() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false)
  
  // Buscar la cuenta
  const cuenta = cuentasMock.find((c) => c.id === id)
  
  // Si no existe, mostrar error
  if (!cuenta) {
    return (
      <div className="px-4 pt-6 pb-4">
        <button
          onClick={() => navigate('/cuentas')}
          className="flex items-center gap-1 text-purple-500 font-medium mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <div className="text-center py-12">
          <p className="text-gray-500">Cuenta no encontrada</p>
        </div>
      </div>
    )
  }
  
  const Icon = obtenerIcono(cuenta.icono)
  const esCredito = cuenta.tipo === 'credito'
  const cupoTotal = cuenta.cupoTotal ?? 0
  const cupoDisponible = cuenta.cupoDisponible ?? 0
  const deuda = cupoTotal - cupoDisponible
  const porcentajeUsado = cupoTotal > 0 ? (deuda / cupoTotal) * 100 : 0
  
  // Filtrar movimientos de esta cuenta (incluye transferencias entrantes y salientes)
  const movimientosCuenta = movimientosMock.filter((mov) => {
    return mov.cuentaId === cuenta.id || mov.cuentaDestinoId === cuenta.id
  })
  
  // Ordenar por fecha descendente
  const movimientosOrdenados = [...movimientosCuenta].sort(
    (a, b) => b.fecha.getTime() - a.fecha.getTime()
  )
  
  // Stats del mes para esta cuenta
  const ahora = new Date()
  const movimientosMes = movimientosCuenta.filter(
    (mov) =>
      mov.fecha.getMonth() === ahora.getMonth() &&
      mov.fecha.getFullYear() === ahora.getFullYear()
  )
  
  const ingresosMes = movimientosMes
    .filter((mov) => mov.tipo === 'ingreso' && mov.cuentaId === cuenta.id)
    .reduce((total, mov) => total + mov.monto, 0)
  
  const egresosMes = movimientosMes
    .filter((mov) => mov.tipo === 'egreso' && mov.cuentaId === cuenta.id)
    .reduce((total, mov) => total + mov.monto, 0)
  
  // Compras a cuotas de esta cuenta (solo si es crédito)
  const comprasCuotasActivas = esCredito
    ? comprasCuotasMock.filter((c) => c.cuentaId === cuenta.id && c.activa)
    : []
  
  const handleEditar = (datos: CuentaFormData) => {
    console.log('Editar cuenta:', datos)
    setModalEdicionAbierto(false)
  }
  
  const handleArchivar = () => {
    if (confirm('¿Estás segura de archivar esta cuenta?')) {
      console.log('Archivar cuenta:', cuenta.id)
      navigate('/cuentas')
    }
    setMenuAbierto(false)
  }
  
  return (
    <>
      <div className="pb-4">
        
        {/* Header con back y menú */}
        <header className="flex items-center justify-between px-4 pt-6 pb-2">
          <button
            onClick={() => navigate('/cuentas')}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          
          {/* Menú dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all"
            >
              <MoreVertical className="w-5 h-5 text-gray-700" />
            </button>
            
            {menuAbierto && (
              <>
                {/* Backdrop invisible para cerrar al hacer click fuera */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuAbierto(false)}
                />
                
                {/* Menú */}
                <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20">
                  <button
                    onClick={() => {
                      setModalEdicionAbierto(true)
                      setMenuAbierto(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar cuenta
                  </button>
                  <button
                    onClick={handleArchivar}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Archive className="w-4 h-4" />
                    Archivar cuenta
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
        
        {/* Hero con info de la cuenta */}
        <div className="px-4 pt-2 pb-6 text-center">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4"
            style={{ backgroundColor: `${cuenta.color}20` }}
          >
            <Icon
              className="w-10 h-10"
              style={{ color: cuenta.color }}
              strokeWidth={2.5}
            />
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            {cuenta.nombre}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {esCredito ? 'Tarjeta de crédito' : 'Cuenta de débito'}
          </p>
          
          {esCredito ? (
            <div className="mt-4">
              <p className="text-3xl font-bold text-gray-800">
                {formatearDinero(cupoDisponible)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                disponible de {formatearDinero(cupoTotal)}
              </p>
              
              {/* Barra de progreso */}
              <div className="max-w-xs mx-auto mt-3">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${porcentajeUsado}%`,
                      backgroundColor: cuenta.color,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-[11px] text-gray-500">
                    {porcentajeUsado.toFixed(0)}% usado
                  </p>
                  <p className="text-[11px] text-rose-500 font-medium">
                    Deuda: {formatearDinero(deuda)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-3xl font-bold text-gray-800 mt-4">
              {formatearDinero(cuenta.saldoActual)}
            </p>
          )}
        </div>
        
        <div className="px-4 space-y-5">
          
          {/* Stats del mes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
                <p className="text-[11px] font-semibold uppercase tracking-wide">
                  Ingresos
                </p>
              </div>
              <p className="text-lg font-bold text-gray-800">
                {formatearDinero(ingresosMes)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                este mes
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center gap-1.5 text-rose-500 mb-1">
                <TrendingDown className="w-4 h-4" strokeWidth={2.5} />
                <p className="text-[11px] font-semibold uppercase tracking-wide">
                  Egresos
                </p>
              </div>
              <p className="text-lg font-bold text-gray-800">
                {formatearDinero(egresosMes)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                este mes
              </p>
            </div>
          </div>
          
          {/* Compras a cuotas (solo si es crédito y tiene compras activas) */}
          {esCredito && comprasCuotasActivas.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5 px-1">
                Compras a cuotas activas
              </h2>
              <div className="space-y-2">
                {comprasCuotasActivas.map((compra) => (
                  <CuotaItem
                    key={compra.id}
                    compra={compra}
                    cuenta={cuenta}
                  />
                ))}
              </div>
            </section>
          )}
          
          {/* Lista de movimientos */}
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5 px-1">
              Movimientos
            </h2>
            
            {movimientosOrdenados.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
                <p className="text-sm text-gray-500">
                  No hay movimientos en esta cuenta
                </p>
                <Link
                  to="/agregar"
                  className="inline-block mt-3 text-sm text-purple-500 font-semibold hover:text-purple-600"
                >
                  Registrar primer movimiento
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {movimientosOrdenados.map((movimiento) => {
                  const cuentaMov = cuentasMock.find((c) => c.id === movimiento.cuentaId)
                  const cuentaDestino = movimiento.cuentaDestinoId
                    ? cuentasMock.find((c) => c.id === movimiento.cuentaDestinoId)
                    : undefined
                  const categoria = movimiento.categoriaId
                    ? categoriasMock.find((c) => c.id === movimiento.categoriaId)
                    : undefined
                  
                  return (
                    <MovimientoItem
                      key={movimiento.id}
                      movimiento={movimiento}
                      cuenta={cuentaMov}
                      cuentaDestino={cuentaDestino}
                      categoria={categoria}
                    />
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
      
      {/* Modal de edición */}
      <Modal
        isOpen={modalEdicionAbierto}
        onClose={() => setModalEdicionAbierto(false)}
        title="Editar cuenta"
      >
        <CuentaForm
          cuenta={cuenta}
          onSubmit={handleEditar}
          onCancel={() => setModalEdicionAbierto(false)}
        />
      </Modal>
    </>
  )
}