import type { Movimiento, Categoria } from '../types'

export interface DatosGrafico {
  categoriaId: string
  nombre: string
  color: string
  total: number
  porcentaje: number
}

/**
 * Agrupa los egresos por categoría y calcula totales y porcentajes.
 * Retorna un array ordenado de mayor a menor gasto.
 */
export function agruparGastosPorCategoria(
  movimientos: Movimiento[],
  categorias: Categoria[]
): DatosGrafico[] {
  // Filtrar solo egresos (las transferencias e ingresos no cuentan)
  const egresos = movimientos.filter((mov) => mov.tipo === 'egreso')
  
  if (egresos.length === 0) return []
  
  // Agrupar por categoriaId
  const totalesPorCategoria = new Map<string, number>()
  
  egresos.forEach((mov) => {
    if (!mov.categoriaId) return
    const totalActual = totalesPorCategoria.get(mov.categoriaId) ?? 0
    totalesPorCategoria.set(mov.categoriaId, totalActual + mov.monto)
  })
  
  // Calcular total general para sacar porcentajes
  const totalGeneral = Array.from(totalesPorCategoria.values()).reduce(
    (sum, val) => sum + val,
    0
  )
  
  // Convertir el Map a array con info de cada categoría
  const datos: DatosGrafico[] = []
  
  totalesPorCategoria.forEach((total, categoriaId) => {
    const categoria = categorias.find((c) => c.id === categoriaId)
    if (!categoria) return
    
    datos.push({
      categoriaId,
      nombre: categoria.nombre,
      color: categoria.color,
      total,
      porcentaje: (total / totalGeneral) * 100,
    })
  })
  
  // Ordenar de mayor a menor
  return datos.sort((a, b) => b.total - a.total)
}