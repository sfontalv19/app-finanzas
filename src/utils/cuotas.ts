import type { CompraCuotas } from '../types'

/**
 * Calcula cuántas cuotas de una compra caen en un mes específico.
 * Retorna la cuota actual (1-based) si cae en ese mes, o null si no cae.
 */
export function obtenerCuotaDelMes(
  compra: CompraCuotas,
  fecha: Date
): number | null {
  const primerPago = compra.primerMesPago
  
  // Calcular cuántos meses han pasado desde el primer pago hasta la fecha objetivo
  const mesesTranscurridos =
    (fecha.getFullYear() - primerPago.getFullYear()) * 12 +
    (fecha.getMonth() - primerPago.getMonth())
  
  // Si es antes del primer pago o después de la última cuota, no aplica
  if (mesesTranscurridos < 0 || mesesTranscurridos >= compra.numeroCuotas) {
    return null
  }
  
  // La cuota actual es 1-based (la primera cuota es "1 de N")
  return mesesTranscurridos + 1
}

/**
 * Calcula el total a pagar en cuotas en un mes específico.
 */
export function calcularCuotasDelMes(
  compras: CompraCuotas[],
  fecha: Date
): number {
  return compras
    .filter((compra) => compra.activa)
    .reduce((total, compra) => {
      const cuotaDelMes = obtenerCuotaDelMes(compra, fecha)
      return cuotaDelMes !== null ? total + compra.valorCuota : total
    }, 0)
}