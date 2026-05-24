import { Link } from 'react-router-dom'
import { ChevronRight, Loader2 } from 'lucide-react'
import BalanceCard from '../components/BalanceCard'
import AccountCard from '../components/AccountCard'
import CuotaItem from '../components/CuotaItem'
import MovimientoItem from '../components/MovimientoItem'
import GraficoGastos from '../components/GraficoGastos'
import { useCuentas } from '../hooks/useCuentas'
import { useCategorias } from '../hooks/useCategorias'
import { useMovimientos } from '../hooks/useMovimientos'
import { useComprasCuotas } from '../hooks/useComprasCuotas'
import { calcularCuotasDelMes } from '../utils/cuotas'
import { agruparGastosPorCategoria } from '../utils/graficos'
import { formatearDinero } from '../utils/formatters'

export default function Dashboard() {
  const { data: cuentas, isLoading: cargandoCuentas } = useCuentas()
  const { data: movimientos, isLoading: cargandoMovimientos } = useMovimientos()
  const { data: categorias } = useCategorias()
  const { data: comprasCuotas } = useComprasCuotas()
  
  const cargando = cargandoCuentas || cargandoMovimientos
  
  // Cálculos solo cuando hay datos
  const cuentasActivas = cuentas?.filter((c) => !c.archivada) ?? []
  
  // Helper: determinar si una cuenta es de débito (sirve para filtrar movimientos reales)
  const esDebitoLaCuenta = (cuentaId: string | undefined) => {
    if (!cuentaId) return false
    const cuenta = cuentasActivas.find((c) => c.id === cuentaId)
    return cuenta?.tipo === 'debito'
  }
  
  // Balance total: solo cuentas de débito/efectivo (no contamos tarjetas de crédito)
  const balanceTotal = cuentasActivas.reduce((total, cuenta) => {
    if (cuenta.tipo === 'debito') {
      return total + cuenta.saldoActual
    }
    return total
  }, 0)
  
  const ahora = new Date()
  const movimientosMes = (movimientos ?? []).filter((mov) => {
    return (
      mov.fecha.getMonth() === ahora.getMonth() &&
      mov.fecha.getFullYear() === ahora.getFullYear()
    )
  })
  
  // Ingresos del mes: solo cuando la cuenta receptora es de débito
  // (un "ingreso" a tarjeta de crédito = pago a tarjeta, no es plata nueva)
  const ingresosMes = movimientosMes
    .filter((mov) => mov.tipo === 'ingreso' && esDebitoLaCuenta(mov.cuentaId))
    .reduce((total, mov) => total + mov.monto, 0)
  
  // Egresos del mes: solo cuando la cuenta origen es de débito
  // (un "egreso" desde tarjeta de crédito = compra con tarjeta, ya se contará cuando se pague)
  const egresosMes = movimientosMes
    .filter((mov) => mov.tipo === 'egreso' && esDebitoLaCuenta(mov.cuentaId))
    .reduce((total, mov) => total + mov.monto, 0)
  
  const nombreMes = new Intl.DateTimeFormat('es-CO', {
    month: 'long',
    year: 'numeric',
  }).format(ahora)
  
  // TODO: compras a cuotas siguen siendo mock
  const comprasActivas = (comprasCuotas ?? []).filter((c) => c.activa)
  const totalCuotasMes = calcularCuotasDelMes(comprasActivas, ahora)
  
  const movimientosRecientes = [...(movimientos ?? [])]
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
    .slice(0, 5)
  
  // Gráfico: solo egresos REALES (los que salieron de cuentas de débito/efectivo)
  const movimientosMesParaGrafico = movimientosMes.filter(
    (mov) => mov.tipo === 'egreso' && esDebitoLaCuenta(mov.cuentaId)
  )
  
  const datosGrafico = categorias 
    ? agruparGastosPorCategoria(movimientosMesParaGrafico, categorias)
    : []
  
  // Estado de carga
  if (cargando) {
    return (
      <div className="px-4 pt-6 pb-4">
        <header className="mb-6">
          <p className="text-gray-500 text-sm">¡Hola! 👋</p>
          <h1 className="text-2xl font-bold text-gray-800 mt-0.5">Tus finanzas</h1>
        </header>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      </div>
    )
  }
  
  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      
      {/* Header */}
      <header>
        <p className="text-gray-500 text-sm">¡Hola! 👋</p>
        <h1 className="text-2xl font-bold text-gray-800 mt-0.5">
          Tus finanzas
        </h1>
        <p className="text-gray-400 text-xs mt-0.5 ">
          {nombreMes}
        </p>
      </header>
      
      {/* Card de balance */}
      <BalanceCard
        balanceTotal={balanceTotal}
        ingresosMes={ingresosMes}
        egresosMes={egresosMes}
      />
      
      {/* Cuentas */}
      {cuentasActivas.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">
              Mis cuentas
            </h2>
            <Link
              to="/cuentas"
              className="flex items-center gap-0.5 text-sm text-purple-500 font-medium hover:text-purple-600"
            >
              Ver todas
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {cuentasActivas.map((cuenta) => (
              <AccountCard key={cuenta.id} cuenta={cuenta} />
            ))}
          </div>
        </section>
      ) : (
        <section className="bg-purple-50 border border-purple-100 rounded-2xl p-5 text-center">
          <p className="text-sm font-semibold text-purple-700">¡Empieza creando tu primera cuenta!</p>
          <p className="text-xs text-purple-600/80 mt-1">
            Agrega Nequi, Bancolombia, tu efectivo, o lo que uses para mover tu dinero.
          </p>
          <Link
            to="/cuentas"
            className="inline-block mt-3 text-sm text-purple-500 font-semibold hover:text-purple-600"
          >
            Ir a cuentas →
          </Link>
        </section>
      )}
      
      {/* Gráfico de gastos por categoría */}
      {datosGrafico.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">
              Gastos por categoría
            </h2>
            <span className="text-xs text-gray-400 capitalize">
              {nombreMes}
            </span>
          </div>
          
          <GraficoGastos datos={datosGrafico} totalGastos={egresosMes} />
        </section>
      )}
      
      {/* Compras a cuotas (todavía mock) */}
      {comprasActivas.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">
              Compras a cuotas
            </h2>
            <Link
              to="/compras-cuotas"
              className="flex items-center gap-0.5 text-sm text-purple-500 font-medium hover:text-purple-600"
            >
              Ver todas
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-4 mb-3 border border-pink-100">
            <p className="text-xs font-medium text-pink-700">A pagar este mes</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">
              {formatearDinero(totalCuotasMes)}
            </p>
            <p className="text-[11px] text-pink-600/70 mt-0.5">
              en {comprasActivas.length} {comprasActivas.length === 1 ? 'compra' : 'compras'} a cuotas
            </p>
          </div>
          
          <div className="space-y-2">
            {comprasActivas.map((compra) => {
              const cuenta = cuentas?.find((c) => c.id === compra.cuentaId)
              return (
                <CuotaItem key={compra.id} compra={compra} cuenta={cuenta} />
              )
            })}
          </div>
        </section>
      )}
      
      {/* Movimientos recientes */}
      {movimientosRecientes.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">
              Movimientos recientes
            </h2>
            <Link
              to="/movimientos"
              className="flex items-center gap-0.5 text-sm text-purple-500 font-medium hover:text-purple-600"
            >
              Ver todos
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-2">
            {movimientosRecientes.map((movimiento) => {
              const cuenta = cuentas?.find((c) => c.id === movimiento.cuentaId)
              const cuentaDestino = movimiento.cuentaDestinoId
                ? cuentas?.find((c) => c.id === movimiento.cuentaDestinoId)
                : undefined
              const categoria = movimiento.categoriaId
                ? categorias?.find((c) => c.id === movimiento.categoriaId)
                : undefined
              
              return (
                <MovimientoItem
                  key={movimiento.id}
                  movimiento={movimiento}
                  cuenta={cuenta}
                  cuentaDestino={cuentaDestino}
                  categoria={categoria}
                />
              )
            })}
          </div>
        </section>
      )}
      
    </div>
  )
}  