import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftRight, MoreVertical, Pencil, Trash2, Loader2 } from 'lucide-react'
import type { Movimiento, Cuenta, Categoria } from '../types'
import { formatearDinero, formatearFechaRelativa } from '../utils/formatters'
import { obtenerIcono } from '../utils/iconos'
import { useEliminarMovimiento } from '../hooks/useMovimientos'

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
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const eliminarMutation = useEliminarMovimiento()
  
  const esTransferencia = movimiento.tipo === 'transferencia'
  const esIngreso = movimiento.tipo === 'ingreso'
  const esEgreso = movimiento.tipo === 'egreso'
  
  // Determinar ícono y color según el tipo
  let Icon
  let colorIcono: string
  
  if (esTransferencia) {
    Icon = ArrowLeftRight
    colorIcono = '#6B7280'
  } else {
    Icon = obtenerIcono(categoria?.icono ?? 'more-horizontal')
    colorIcono = categoria?.color ?? '#6B7280'
  }
  
  let textoSecundario: string
  if (esTransferencia) {
    textoSecundario = `${cuenta?.nombre ?? '?'} → ${cuentaDestino?.nombre ?? '?'}`
  } else {
    textoSecundario = `${categoria?.nombre ?? 'Sin categoría'} · ${cuenta?.nombre ?? 'Sin cuenta'}`
  }
  
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
  
  const handleEditar = () => {
    setMenuAbierto(false)
    navigate(`/agregar/${movimiento.id}`)
  }
  
  const handleEliminar = async () => {
    setMenuAbierto(false)
    if (!confirm(`¿Eliminar este movimiento? El saldo de la cuenta volverá a su valor anterior.`)) {
      return
    }
    
    try {
      await eliminarMutation.mutateAsync(movimiento)
    } catch (err) {
      console.error('Error al eliminar movimiento:', err)
      alert('No se pudo eliminar. Intenta de nuevo.')
    }
  }
  
  return (
    <div className="bg-white rounded-2xl p-3.5 border border-gray-100 flex items-center gap-3 relative">
      
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
      
      {/* Botón de menú */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setMenuAbierto(!menuAbierto)
        }}
        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all -mr-1"
        disabled={eliminarMutation.isPending}
      >
        {eliminarMutation.isPending ? (
          <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
        ) : (
          <MoreVertical className="w-4 h-4 text-gray-400" />
        )}
      </button>
      
      {/* Menú dropdown */}
      {menuAbierto && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setMenuAbierto(false)}
          />
          <div className="absolute right-2 top-12 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20">
            <button
              onClick={handleEditar}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </button>
            <button
              onClick={handleEliminar}
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
}
