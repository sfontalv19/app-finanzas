import { useState } from 'react'
import { ChevronDown, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'

interface SelectorFechaProps {
  fecha: Date
  onChange: (fecha: Date) => void
  label?: string
}

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function formatearFechaLabel(fecha: Date): string {
  const hoy = new Date()
  const ayer = new Date()
  ayer.setDate(ayer.getDate() - 1)
  
  const sinHora = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  
  if (sinHora(fecha) === sinHora(hoy)) return 'Hoy'
  if (sinHora(fecha) === sinHora(ayer)) return 'Ayer'
  
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: fecha.getFullYear() !== hoy.getFullYear() ? 'numeric' : undefined,
  }).format(fecha)
}

export default function SelectorFecha({ fecha, onChange, label = 'Fecha' }: SelectorFechaProps) {
  const [abierto, setAbierto] = useState(false)
  const [mesVisible, setMesVisible] = useState(new Date(fecha.getFullYear(), fecha.getMonth(), 1))
  
  const handleSelect = (nuevaFecha: Date) => {
    onChange(nuevaFecha)
    setAbierto(false)
  }
  
  const cambiarMes = (delta: number) => {
    setMesVisible(new Date(mesVisible.getFullYear(), mesVisible.getMonth() + delta, 1))
  }
  
  // Calcular días del calendario
  const primerDiaMes = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 1)
  const ultimoDiaMes = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 0)
  const diaSemanaPrimerDia = (primerDiaMes.getDay() + 6) % 7 // lunes = 0
  const totalDias = ultimoDiaMes.getDate()
  
  const dias: (Date | null)[] = []
  // Espacios vacíos al inicio
  for (let i = 0; i < diaSemanaPrimerDia; i++) dias.push(null)
  // Días del mes
  for (let i = 1; i <= totalDias; i++) {
    dias.push(new Date(mesVisible.getFullYear(), mesVisible.getMonth(), i))
  }
  
  const hoy = new Date()
  const esMismoDia = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 active:scale-[0.99] transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4 text-purple-500" strokeWidth={2.5} />
          </div>
          <span className="flex-1 text-left text-gray-800 font-medium">
            {formatearFechaLabel(fecha)}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      
      <BottomSheet
        isOpen={abierto}
        onClose={() => setAbierto(false)}
        title="Selecciona la fecha"
      >
        <div className="p-4">
          {/* Accesos rápidos */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => handleSelect(new Date())}
              className="flex-1 py-2 text-sm font-medium bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => {
                const ayer = new Date()
                ayer.setDate(ayer.getDate() - 1)
                handleSelect(ayer)
              }}
              className="flex-1 py-2 text-sm font-medium bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Ayer
            </button>
          </div>
          
          {/* Navegación de mes */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => cambiarMes(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <p className="font-semibold text-gray-800 text-sm">
              {MESES[mesVisible.getMonth()]} {mesVisible.getFullYear()}
            </p>
            <button
              type="button"
              onClick={() => cambiarMes(1)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-1">
                {d}
              </div>
            ))}
          </div>
          
          {/* Días del calendario */}
          <div className="grid grid-cols-7 gap-1 pb-2">
            {dias.map((dia, idx) => {
              if (!dia) return <div key={`empty-${idx}`} />
              
              const esHoy = esMismoDia(dia, hoy)
              const esSeleccionado = esMismoDia(dia, fecha)
              const esFuturo = dia.getTime() > hoy.getTime()
              
              return (
                <button
                  key={dia.toISOString()}
                  type="button"
                  disabled={esFuturo}
                  onClick={() => handleSelect(dia)}
                  className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                    esSeleccionado
                      ? 'bg-gradient-to-br from-purple-400 to-pink-400 text-white shadow-md'
                      : esFuturo
                      ? 'text-gray-300 cursor-not-allowed'
                      : esHoy
                      ? 'bg-purple-50 text-purple-600 font-bold'
                      : 'text-gray-700 hover:bg-gray-100 active:scale-95'
                  }`}
                >
                  {dia.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      </BottomSheet>
    </>
  )
}
