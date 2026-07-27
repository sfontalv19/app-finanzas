import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, TrendingDown, Loader2, Calendar } from 'lucide-react'
import { useMovimientos } from '../hooks/useMovimientos'
import { useCuentas } from '../hooks/useCuentas'
import { formatearDinero } from '../utils/formatters'
import type { Movimiento } from '../types'

interface ResumenMes {
  clave: string
  año: number
  mes: number
  fechaInicio: Date
  cantidadMovimientos: number
  ingresos: number
  egresos: number
  balance: number
  esMesActual: boolean
}

export default function HistorialMensual() {
  const navigate = useNavigate()
  const { data: movimientos, isLoading } = useMovimientos()
  const { data: cuentas } = useCuentas()
  
  const cuentasActivas = cuentas?.filter((c) => !c.archivada) ?? []
  
  const esDebitoLaCuenta = (cuentaId: string | undefined) => {
    if (!cuentaId) return false
    const cuenta = cuentasActivas.find((c) => c.id === cuentaId)
    return cuenta?.tipo === 'debito'
  }
  
  const esCreditoLaCuenta = (cuentaId: string | undefined) => {
    if (!cuentaId) return false
    const cuenta = cuentasActivas.find((c) => c.id === cuentaId)
    return cuenta?.tipo === 'credito'
  }

  const resumenPorMes = useMemo<ResumenMes[]>(() => {
    if (!movimientos || movimientos.length === 0) return []
    
    const ahora = new Date()
    const claveActual = `${ahora.getFullYear()}-${String(ahora.getMonth()).padStart(2, '0')}`
    
    const grupos = new Map<string, Movimiento[]>()
    
    for (const mov of movimientos) {
      const clave = `${mov.fecha.getFullYear()}-${String(mov.fecha.getMonth()).padStart(2, '0')}`
      const existente = grupos.get(clave) ?? []
      grupos.set(clave, [...existente, mov])
    }
    
    const resumenes: ResumenMes[] = []
    
    for (const [clave, movs] of grupos.entries()) {
      const [añoStr, mesStr] = clave.split('-')
      const año = parseInt(añoStr, 10)
      const mes = parseInt(mesStr, 10)
      
      const ingresos = movs
        .filter((m) => m.tipo === 'ingreso' && esDebitoLaCuenta(m.cuentaId))
        .reduce((sum, m) => sum + m.monto, 0)
      
      const egresos = movs
        .filter((m) => {
          const esEgresoDirecto = m.tipo === 'egreso' && esDebitoLaCuenta(m.cuentaId)
          const esPagoATarjeta =
            m.tipo === 'transferencia' &&
            esDebitoLaCuenta(m.cuentaId) &&
            esCreditoLaCuenta(m.cuentaDestinoId)
          return esEgresoDirecto || esPagoATarjeta
        })
        .reduce((sum, m) => sum + m.monto, 0)
      
      resumenes.push({
        clave,
        año,
        mes,
        fechaInicio: new Date(año, mes, 1),
        cantidadMovimientos: movs.length,
        ingresos,
        egresos,
        balance: ingresos - egresos,
        esMesActual: clave === claveActual,
      })
    }
    
    return resumenes.sort((a, b) => {
      if (a.año !== b.año) return b.año - a.año
      return b.mes - a.mes
    })
  }, [movimientos, cuentas])

  const formatearNombreMes = (fecha: Date) => {
    const nombre = new Intl.DateTimeFormat('es-CO', {
      month: 'long',
      year: 'numeric',
    }).format(fecha)
    return nombre.charAt(0).toUpperCase() + nombre.slice(1)
  }
  
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
          <h1 className="text-xl font-bold text-gray-800">Historial mensual</h1>
        </header>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      
      <header className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Historial mensual</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            {resumenPorMes.length} {resumenPorMes.length === 1 ? 'mes' : 'meses'} con actividad
          </p>
        </div>
      </header>
      
      {resumenPorMes.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-50 rounded-full mb-3">
            <Calendar className="w-8 h-8 text-purple-400" strokeWidth={2} />
          </div>
          <p className="text-gray-600 font-medium">Aún no hay historial</p>
          <p className="text-xs text-gray-400 mt-1">
            Registra tus primeros movimientos para ver el resumen mensual
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {resumenPorMes.map((resumen) => (
            <div
              key={resumen.clave}
              className={`rounded-2xl p-4 border transition-all ${
                resumen.esMesActual
                  ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
                  : 'bg-white border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className={`font-bold text-base ${resumen.esMesActual ? 'text-purple-700' : 'text-gray-800'}`}>
                    {formatearNombreMes(resumen.fechaInicio)}
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {resumen.cantidadMovimientos} {resumen.cantidadMovimientos === 1 ? 'movimiento' : 'movimientos'}
                    {resumen.esMesActual && ' · Mes actual'}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Balance</p>
                  <p className={`text-base font-bold ${
                    resumen.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {resumen.balance >= 0 ? '+' : ''}{formatearDinero(resumen.balance)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/70 rounded-xl p-2.5">
                  <div className="flex items-center gap-1 text-emerald-600 mb-0.5">
                    <TrendingUp className="w-3 h-3" strokeWidth={2.5} />
                    <p className="text-[10px] font-semibold uppercase tracking-wide">Ingresos</p>
                  </div>
                  <p className="text-sm font-bold text-gray-800">
                    {formatearDinero(resumen.ingresos)}
                  </p>
                </div>
                
                <div className="bg-white/70 rounded-xl p-2.5">
                  <div className="flex items-center gap-1 text-rose-500 mb-0.5">
                    <TrendingDown className="w-3 h-3" strokeWidth={2.5} />
                    <p className="text-[10px] font-semibold uppercase tracking-wide">Egresos</p>
                  </div>
                  <p className="text-sm font-bold text-gray-800">
                    {formatearDinero(resumen.egresos)}
                  </p>
                </div>
              </div>
              
              {resumen.ingresos > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-rose-400 h-full"
                      style={{
                        width: `${Math.min((resumen.egresos / resumen.ingresos) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5">
                    {resumen.balance >= 0
                      ? `Ahorraste ${((resumen.balance / resumen.ingresos) * 100).toFixed(0)}% de tus ingresos`
                      : `Gastaste más de lo que ingresaste`}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {resumenPorMes.length > 0 && (
        <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3 flex items-start gap-2.5 mt-4">
          <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-purple-600 text-xs font-bold">i</span>
          </div>
          <div>
            <p className="text-[11px] text-purple-700/80 leading-relaxed">
              El Dashboard siempre muestra el <strong>mes actual</strong>. Los meses anteriores quedan registrados aquí en el historial para consulta.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
