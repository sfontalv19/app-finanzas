import { useState, useMemo } from 'react'
import { Search, Filter, X, TrendingUp, TrendingDown, ArrowLeftRight, Loader2 } from 'lucide-react'
import MovimientoItem from '../components/MovimientoItem'
import BottomSheet from '../components/ui/BottomSheet'
import { useCuentas } from '../hooks/useCuentas'
import { useCategorias } from '../hooks/useCategorias'
import { useMovimientos } from '../hooks/useMovimientos'
import { formatearDinero } from '../utils/formatters'
import type { TipoMovimiento } from '../types'

type FiltroTipo = 'todos' | TipoMovimiento

export default function Movimientos() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroAbierto, setFiltroAbierto] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')
  const [filtroCuentaId, setFiltroCuentaId] = useState<string | null>(null)
  const [filtroCategoriaId, setFiltroCategoriaId] = useState<string | null>(null)
  
  const { data: movimientos, isLoading } = useMovimientos()
  const { data: cuentas } = useCuentas()
  const { data: categorias } = useCategorias()
  
  // Movimientos filtrados
  const movimientosFiltrados = useMemo(() => {
    if (!movimientos) return []
    
    return movimientos
      .filter((mov) => {
        // Filtro por tipo
        if (filtroTipo !== 'todos' && mov.tipo !== filtroTipo) return false
        
        // Filtro por cuenta
        if (filtroCuentaId && mov.cuentaId !== filtroCuentaId && mov.cuentaDestinoId !== filtroCuentaId) {
          return false
        }
        
        // Filtro por categoría
        if (filtroCategoriaId && mov.categoriaId !== filtroCategoriaId) return false
        
        // Filtro por búsqueda
        if (busqueda) {
          const textoBusqueda = busqueda.toLowerCase()
          return mov.descripcion.toLowerCase().includes(textoBusqueda)
        }
        
        return true
      })
  }, [movimientos, busqueda, filtroTipo, filtroCuentaId, filtroCategoriaId])
  
  // Agrupar por mes/año
  const movimientosAgrupados = useMemo(() => {
    const grupos = new Map<string, typeof movimientosFiltrados>()
    
    movimientosFiltrados.forEach((mov) => {
      const clave = `${mov.fecha.getFullYear()}-${mov.fecha.getMonth()}`
      const existente = grupos.get(clave) ?? []
      grupos.set(clave, [...existente, mov])
    })
    
    return Array.from(grupos.entries()).map(([clave, movs]) => {
      const [anio, mes] = clave.split('-').map(Number)
      const fechaGrupo = new Date(anio, mes, 1)
      return {
        clave,
        fecha: fechaGrupo,
        movimientos: movs,
      }
    })
  }, [movimientosFiltrados])
  
  // Helpers para clasificar movimientos según tipo de cuenta
  const esDebitoLaCuenta = (cuentaId: string | undefined) => {
    if (!cuentaId) return false
    const cuenta = cuentas?.find((c) => c.id === cuentaId)
    return cuenta?.tipo === 'debito'
  }
  
  const esCreditoLaCuenta = (cuentaId: string | undefined) => {
    if (!cuentaId) return false
    const cuenta = cuentas?.find((c) => c.id === cuentaId)
    return cuenta?.tipo === 'credito'
  }
  
  // Stats del periodo filtrado (misma lógica que el Dashboard)
  const stats = useMemo(() => {
    // Ingresos: solo cuando la cuenta receptora es de débito
    // (un "ingreso" a tarjeta de crédito = pago a tarjeta, no es plata nueva)
    const ingresos = movimientosFiltrados
      .filter((m) => m.tipo === 'ingreso' && esDebitoLaCuenta(m.cuentaId))
      .reduce((sum, m) => sum + m.monto, 0)
    
    // Egresos:
    // - Egresos directos desde cuentas de débito
    // - Transferencias débito → crédito (pagos a tarjeta)
    const egresos = movimientosFiltrados
      .filter((m) => {
        const esEgresoDirecto = m.tipo === 'egreso' && esDebitoLaCuenta(m.cuentaId)
        const esPagoATarjeta =
          m.tipo === 'transferencia' &&
          esDebitoLaCuenta(m.cuentaId) &&
          esCreditoLaCuenta(m.cuentaDestinoId)
        return esEgresoDirecto || esPagoATarjeta
      })
      .reduce((sum, m) => sum + m.monto, 0)
    
    return { ingresos, egresos, balance: ingresos - egresos }
  }, [movimientosFiltrados, cuentas])
  
  const hayFiltrosActivos = filtroTipo !== 'todos' || filtroCuentaId !== null || filtroCategoriaId !== null
  
  const limpiarFiltros = () => {
    setFiltroTipo('todos')
    setFiltroCuentaId(null)
    setFiltroCategoriaId(null)
  }
  
  // Estado de carga
  if (isLoading) {
    return (
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Movimientos</h1>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      </div>
    )
  }
  
  return (
    <>
      <div className="px-4 pt-6 pb-4 space-y-4">
        
        {/* Header */}
        <header>
          <h1 className="text-2xl font-bold text-gray-800">
            Movimientos
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {movimientosFiltrados.length} {movimientosFiltrados.length === 1 ? 'movimiento' : 'movimientos'}
          </p>
        </header>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-3 border border-gray-100">
            <div className="flex items-center gap-1 text-emerald-600 mb-0.5">
              <TrendingUp className="w-3.5 h-3.5" strokeWidth={2.5} />
              <p className="text-[10px] font-semibold uppercase tracking-wide">Ingresos</p>
            </div>
            <p className="text-base font-bold text-gray-800">
              {formatearDinero(stats.ingresos)}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-gray-100">
            <div className="flex items-center gap-1 text-rose-500 mb-0.5">
              <TrendingDown className="w-3.5 h-3.5" strokeWidth={2.5} />
              <p className="text-[10px] font-semibold uppercase tracking-wide">Egresos</p>
            </div>
            <p className="text-base font-bold text-gray-800">
              {formatearDinero(stats.egresos)}
            </p>
          </div>
        </div>
        
        {/* Búsqueda + filtros */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition"
            />
          </div>
          <button
            onClick={() => setFiltroAbierto(true)}
            className={`w-11 h-11 flex items-center justify-center rounded-xl border transition-all active:scale-95 relative ${
              hayFiltrosActivos
                ? 'border-purple-400 bg-purple-50 text-purple-600'
                : 'border-gray-200 bg-white text-gray-500'
            }`}
          >
            <Filter className="w-4 h-4" strokeWidth={2.5} />
            {hayFiltrosActivos && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full" />
            )}
          </button>
        </div>
        
        {/* Chips de filtros activos */}
        {hayFiltrosActivos && (
          <div className="flex flex-wrap gap-2">
            {filtroTipo !== 'todos' && (
              <FiltroChip
                label={filtroTipo === 'ingreso' ? 'Ingresos' : filtroTipo === 'egreso' ? 'Egresos' : 'Transferencias'}
                onRemove={() => setFiltroTipo('todos')}
              />
            )}
            {filtroCuentaId && (
              <FiltroChip
                label={cuentas?.find((c) => c.id === filtroCuentaId)?.nombre ?? '?'}
                onRemove={() => setFiltroCuentaId(null)}
              />
            )}
            {filtroCategoriaId && (
              <FiltroChip
                label={categorias?.find((c) => c.id === filtroCategoriaId)?.nombre ?? '?'}
                onRemove={() => setFiltroCategoriaId(null)}
              />
            )}
            <button
              onClick={limpiarFiltros}
              className="text-xs text-purple-500 font-semibold underline ml-1 self-center"
            >
              Limpiar
            </button>
          </div>
        )}
        
        {/* Lista */}
        {movimientosAgrupados.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">
              {movimientos && movimientos.length === 0
                ? 'Aún no has registrado movimientos'
                : 'No se encontraron movimientos con esos filtros'}
            </p>
            {hayFiltrosActivos && (
              <button
                onClick={limpiarFiltros}
                className="mt-2 text-sm text-purple-500 font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {movimientosAgrupados.map((grupo) => (
              <section key={grupo.clave}>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5 px-1 capitalize">
                  {new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(grupo.fecha)}
                </h2>
                <div className="space-y-2">
                  {grupo.movimientos.map((mov) => {
                    const cuenta = cuentas?.find((c) => c.id === mov.cuentaId)
                    const cuentaDestino = mov.cuentaDestinoId
                      ? cuentas?.find((c) => c.id === mov.cuentaDestinoId)
                      : undefined
                    const categoria = mov.categoriaId
                      ? categorias?.find((c) => c.id === mov.categoriaId)
                      : undefined
                    
                    return (
                      <MovimientoItem
                        key={mov.id}
                        movimiento={mov}
                        cuenta={cuenta}
                        cuentaDestino={cuentaDestino}
                        categoria={categoria}
                      />
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
      
      {/* Bottom sheet de filtros */}
      <BottomSheet
        isOpen={filtroAbierto}
        onClose={() => setFiltroAbierto(false)}
        title="Filtros"
      >
        <div className="p-5 space-y-5">
          
          {/* Tipo */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Tipo de movimiento
            </p>
            <div className="grid grid-cols-2 gap-2">
              <BotonFiltro
                activo={filtroTipo === 'todos'}
                onClick={() => setFiltroTipo('todos')}
                label="Todos"
              />
              <BotonFiltro
                activo={filtroTipo === 'ingreso'}
                onClick={() => setFiltroTipo('ingreso')}
                label="Ingresos"
                icon={<TrendingUp className="w-3.5 h-3.5" />}
              />
              <BotonFiltro
                activo={filtroTipo === 'egreso'}
                onClick={() => setFiltroTipo('egreso')}
                label="Egresos"
                icon={<TrendingDown className="w-3.5 h-3.5" />}
              />
              <BotonFiltro
                activo={filtroTipo === 'transferencia'}
                onClick={() => setFiltroTipo('transferencia')}
                label="Transferencias"
                icon={<ArrowLeftRight className="w-3.5 h-3.5" />}
              />
            </div>
          </div>
          
          {/* Cuenta */}
          {cuentas && cuentas.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Cuenta
              </p>
              <div className="grid grid-cols-2 gap-2">
                <BotonFiltro
                  activo={filtroCuentaId === null}
                  onClick={() => setFiltroCuentaId(null)}
                  label="Todas"
                />
                {cuentas.filter((c) => !c.archivada).map((cuenta) => (
                  <BotonFiltro
                    key={cuenta.id}
                    activo={filtroCuentaId === cuenta.id}
                    onClick={() => setFiltroCuentaId(cuenta.id)}
                    label={cuenta.nombre}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Categoría */}
          {categorias && categorias.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Categoría
              </p>
              <div className="grid grid-cols-2 gap-2">
                <BotonFiltro
                  activo={filtroCategoriaId === null}
                  onClick={() => setFiltroCategoriaId(null)}
                  label="Todas"
                />
                {categorias.map((cat) => (
                  <BotonFiltro
                    key={cat.id}
                    activo={filtroCategoriaId === cat.id}
                    onClick={() => setFiltroCategoriaId(cat.id)}
                    label={cat.nombre}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Botones */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                limpiarFiltros()
                setFiltroAbierto(false)
              }}
              className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => setFiltroAbierto(false)}
              className="flex-1 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold rounded-xl shadow-md shadow-purple-200"
            >
              Aplicar
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  )
}

function FiltroChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
      {label}
      <button onClick={onRemove} className="hover:bg-purple-200 rounded-full p-0.5">
        <X className="w-3 h-3" strokeWidth={3} />
      </button>
    </div>
  )
}

function BotonFiltro({
  activo,
  onClick,
  label,
  icon,
}: {
  activo: boolean
  onClick: () => void
  label: string
  icon?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
        activo
          ? 'border-purple-400 bg-purple-50 text-purple-700'
          : 'border-gray-200 bg-white text-gray-600'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}