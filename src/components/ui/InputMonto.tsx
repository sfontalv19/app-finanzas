import { forwardRef, useEffect, useState } from 'react'

interface InputMontoProps {
  value: number | undefined
  onChange: (valor: number | undefined) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
  variant?: 'default' | 'large'
  colorClass?: string
}

function formatearVisual(numero: number | undefined): string {
  if (numero === undefined || numero === null) return ''
  if (numero === 0) return ''
  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
  }).format(numero)
}

function parsearVisual(texto: string): number | undefined {
  const soloDigitos = texto.replace(/\D/g, '')
  if (soloDigitos === '') return undefined
  const num = parseInt(soloDigitos, 10)
  return isNaN(num) ? undefined : num
}

const InputMonto = forwardRef<HTMLInputElement, InputMontoProps>(
  ({ value, onChange, placeholder = '0', className = '', autoFocus, variant = 'default', colorClass }, ref) => {
    const [textoVisual, setTextoVisual] = useState(() => formatearVisual(value))
    
    useEffect(() => {
      setTextoVisual(formatearVisual(value))
    }, [value])
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const nuevoTexto = e.target.value
      const numero = parsearVisual(nuevoTexto)
      
      if (numero !== undefined && numero > 999999999) return
      
      setTextoVisual(formatearVisual(numero))
      onChange(numero)
    }
    
    if (variant === 'large') {
      return (
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={textoVisual}
          onChange={handleChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`text-5xl font-bold bg-transparent text-center w-full max-w-[280px] focus:outline-none placeholder:text-gray-300 ${colorClass ?? 'text-gray-800'} ${className}`}
        />
      )
    }
    
    return (
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">
          $
        </span>
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={textoVisual}
          onChange={handleChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent focus:bg-white transition ${className}`}
        />
      </div>
    )
  }
)

InputMonto.displayName = 'InputMonto'

export default InputMonto
