import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import BalanceCard from '../components/BalanceCard'
import AccountCard from '../components/AccountCard'
import CuotaItem from '../components/CuotaItem'
import MovimientoItem from '../components/MovimientoItem'
import GraficoGastos from '../components/GraficoGastos'
import {
  cuentasMock,
  movimientosMock,
  comprasCuotasMock,
  categoriasMock,
} from '../lib/mockData'
import { calcularCuotasDelMes } from '../utils/cuotas'
import { agruparGastosPorCategoria } from '../utils/graficos'
import { formatearDinero } from '../utils/formatters'

export default function Dashboard() {
  // Calcular balance total
  const balanceTotal = cuentasMock.reduce((total, cuenta) => {
    if (cuenta.tipo === 'debito') {
      return total + cuenta.saldoActual
    } else {
      const deuda = (cuenta.cupoTotal ?? 0) - (cuenta.cupoDisponible ?? 0)
      return total - deuda
    }
  }, 0)
  
  // Movimientos del mes actual
  const ahora = new Date()
  const movimientosMes = movimientosMock.filter((mov) => {
    return (
      mov.fecha.getMonth() === ahora.getMonth() &&
      mov.fecha.getFullYear() === ahora.getFullYear()
    )
  })
  
  const ingresosMes = movimientosMes
    .filter((mov) => mov.tipo === 'ingreso')
    .reduce((total, mov) => total + mov.monto, 0)
  
  const egresosMes = movimientosMes
    .filter((mov) => mov.tipo === 'egreso')
    .reduce((total, mov) => total + mov.monto, 0)
  
  const nombreMes = new Intl.DateTimeFormat('es-CO', {
    month: 'long',
    year: 'numeric',
  }).format(ahora)
  
  const cuentasActivas = cuentasMock.filter((c) => !c.archivada)
  const comprasActivas = comprasCuotasMock.filter((c) => c.activa)
  const totalCuotasMes = calcularCuotasDelMes(comprasActivas, ahora)
  
  // Últimos 5 movimientos
  const movimientosRecientes = [...movimientosMock]
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
    .slice(0, 5)
  
  // Datos del gráfico (gastos del mes agrupados por categoría)
  const datosGrafico = agruparGastosPorCategoria(movimientosMes, categoriasMock)
  
  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      
      {/* Header con saludo */}
      <header>
        <p className="text-gray-500 text-sm">¡Hola! 👋</p>
        <h1 className="text-2xl font-bold text-gray-800 mt-0.5">
          Tus finanzas
        </h1>
        <p className="text-gray-400 text-xs mt-0.5 capitalize">
          {nombreMes}
        </p>
      </header>
      
      {/* Card de balance */}
      <BalanceCard
        balanceTotal={balanceTotal}
        ingresosMes={ingresosMes}
        egresosMes={egresosMes}
      />
      
      {/* Sección de cuentas */}
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
      
      {/* Sección de gastos por categoría */}
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
      
      {/* Sección de compras a cuotas */}
      {comprasActivas.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">
              Compras a cuotas
            </h2>
            <Link
              to="/mas"
              className="flex items-center gap-0.5 text-sm text-purple-500 font-medium hover:text-purple-600"
            >
              Ver todas
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-4 mb-3 border border-pink-100">
            <p className="text-xs font-medium text-pink-700">
              A pagar este mes
            </p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">
              {formatearDinero(totalCuotasMes)}
            </p>
            <p className="text-[11px] text-pink-600/70 mt-0.5">
              en {comprasActivas.length} {comprasActivas.length === 1 ? 'compra' : 'compras'} a cuotas
            </p>
          </div>
          
          <div className="space-y-2">
            {comprasActivas.map((compra) => {
              const cuenta = cuentasMock.find((c) => c.id === compra.cuentaId)
              return (
                <CuotaItem
                  key={compra.id}
                  compra={compra}
                  cuenta={cuenta}
                />
              )
            })}
          </div>
        </section>
      )}
      
      {/* Sección de movimientos recientes */}
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
              const cuenta = cuentasMock.find((c) => c.id === movimiento.cuentaId)
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