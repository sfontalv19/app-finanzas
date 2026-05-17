import { ArrowLeftRight } from 'lucide-react'
import type { Movimiento, Cuenta, Categoria } from '../types'
import { formatearDinero, formatearFechaRelativa } from '../utils/formatters'
import { obtenerIcono } from '../utils/iconos'

interface MovimientoItemProps {
  movimiento: Movimiento
  cuenta: Cuenta | undefined
  cuentaDestino?: Cuenta | undefined
  categoria: Categoria | undefined
}

export default function MovimientoItem({
  movimiento,
  cuenta,
  cuentaDestino,
  categoria,
}: MovimientoItemProps) {
  const esTransferencia = movimiento.tipo === 'transferencia'
  const esIngreso = movimiento.tipo === 'ingreso'
  const esEgreso = movimiento.tipo === 'egreso'
  
  // Determinar ícono y color según el tipo
  let Icon
  let colorIcono: string
  
  if (esTransferencia) {
    Icon = ArrowLeftRight
    colorIcono = '#6B7280' // gris
  } else {
    Icon = obtenerIcono(categoria?.icono ?? 'more-horizontal')
    colorIcono = categoria?.color ?? '#6B7280'
  }
  
  // Determinar texto de la línea secundaria
  let textoSecundario: string
  if (esTransferencia) {
    textoSecundario = `${cuenta?.nombre ?? '?'} → ${cuentaDestino?.nombre ?? '?'}`
  } else {
    textoSecundario = `${categoria?.nombre ?? 'Sin categoría'} · ${cuenta?.nombre ?? 'Sin cuenta'}`
  }
  
  // Color y signo del monto
  let colorMonto: string
  let signoMonto: string
  
  if (esIngreso) {
    colorMonto = 'text-emerald-600'
    signoMonto = '+'
  } else if (esEgreso) {
    colorMonto = 'text-rose-600'
    signoMonto = '-'
  } else {
    colorMonto = 'text-gray-600'
    signoMonto = ''
  }
  
  return (
    <div className="bg-white rounded-2xl p-3.5 border border-gray-100 flex items-center gap-3">
      
      {/* Ícono */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${colorIcono}20` }}
      >
        <Icon
          className="w-5 h-5"
          style={{ color: colorIcono }}
          strokeWidth={2.5}
        />
      </div>
      
      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm truncate">
          {movimiento.descripcion}
        </p>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {textoSecundario} · {formatearFechaRelativa(movimiento.fecha)}
        </p>
      </div>
      
      {/* Monto */}
      <p className={`font-bold text-sm whitespace-nowrap ${colorMonto}`}>
        {signoMonto}{formatearDinero(movimiento.monto)}
      </p>
    </div>
  )
}