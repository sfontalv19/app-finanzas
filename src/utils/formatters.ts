// Formatea un número como pesos colombianos: 1500000 → "$1.500.000"
export function formatearDinero(monto: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monto)
}

// Formatea fechas de forma amigable: "18 abr 2026"
export function formatearFecha(fecha: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(fecha)
}

// Formatea fecha relativa: "Hoy", "Ayer", "18 abr"
export function formatearFechaRelativa(fecha: Date): string {
  const hoy = new Date()
  const ayer = new Date()
  ayer.setDate(ayer.getDate() - 1)
  
  const fechaSinHora = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const ayerSinHora = new Date(ayer.getFullYear(), ayer.getMonth(), ayer.getDate())
  
  if (fechaSinHora.getTime() === hoySinHora.getTime()) return 'Hoy'
  if (fechaSinHora.getTime() === ayerSinHora.getTime()) return 'Ayer'
  
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
  }).format(fecha)
}
