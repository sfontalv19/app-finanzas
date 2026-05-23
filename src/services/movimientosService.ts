import {
  collection,
  doc,
  getDocs,
  writeBatch,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Movimiento } from '../types'
import type { MovimientoFormData } from '../lib/schemas'

/**
 * Construye la referencia a la colección de movimientos de un usuario.
 */
function refMovimientos(userId: string) {
  return collection(db, 'usuarios', userId, 'movimientos')
}

/**
 * Construye la referencia a una cuenta específica.
 */
function refCuenta(userId: string, cuentaId: string) {
  return doc(db, 'usuarios', userId, 'cuentas', cuentaId)
}

/**
 * Obtiene todos los movimientos del usuario, ordenados por fecha desc.
 */
export async function obtenerMovimientos(userId: string): Promise<Movimiento[]> {
  const q = query(refMovimientos(userId), orderBy('fecha', 'desc'))
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      tipo: data.tipo,
      monto: data.monto,
      cuentaId: data.cuentaId,
      cuentaDestinoId: data.cuentaDestinoId,
      categoriaId: data.categoriaId,
      descripcion: data.descripcion,
      fecha: data.fecha?.toDate() ?? new Date(),
      creadoEn: data.creadoEn?.toDate() ?? new Date(),
      compraCuotasId: data.compraCuotasId,
    }
  })
}

/**
 * Calcula los nuevos saldos de una cuenta según el tipo de movimiento.
 */
function calcularAjusteCuenta(
  cuentaActual: {
    tipo: 'debito' | 'credito'
    saldoActual: number
    cupoDisponible?: number
  },
  monto: number,
  esIngresoEnCuenta: boolean
): { saldoActual?: number; cupoDisponible?: number } {
  // Si es débito: ajusta saldoActual
  if (cuentaActual.tipo === 'debito') {
    const delta = esIngresoEnCuenta ? monto : -monto
    return { saldoActual: cuentaActual.saldoActual + delta }
  }
  
  // Si es crédito: ajusta cupoDisponible
  // Un "egreso" en crédito = compraste, aumenta deuda, baja cupoDisponible
  // Un "ingreso" en crédito = pagaste la tarjeta, baja deuda, sube cupoDisponible
  const cupoDisponibleActual = cuentaActual.cupoDisponible ?? 0
  const delta = esIngresoEnCuenta ? monto : -monto
  return { cupoDisponible: cupoDisponibleActual + delta }
}

/**
 * Crea un movimiento y actualiza los saldos en una sola operación atómica.
 */
export async function crearMovimiento(
  userId: string,
  datos: MovimientoFormData
): Promise<string> {
  const batch = writeBatch(db)
  
  // 1. Crear referencia para el nuevo movimiento (sin guardarlo aún)
  const movimientoRef = doc(refMovimientos(userId))
  
  batch.set(movimientoRef, {
    tipo: datos.tipo,
    monto: datos.monto,
    cuentaId: datos.cuentaId,
    cuentaDestinoId: datos.cuentaDestinoId ?? null,
    categoriaId: datos.categoriaId ?? null,
    descripcion: datos.descripcion,
    fecha: Timestamp.fromDate(datos.fecha),
    creadoEn: serverTimestamp(),
    compraCuotasId: null,
  })
  
  // 2. Leer la cuenta origen para calcular el nuevo saldo
  const cuentaOrigenSnapshot = await getDocs(
    query(collection(db, 'usuarios', userId, 'cuentas'))
  )
  const cuentaOrigenDoc = cuentaOrigenSnapshot.docs.find((d) => d.id === datos.cuentaId)
  
  if (!cuentaOrigenDoc) {
    throw new Error('Cuenta origen no encontrada')
  }
  
  const cuentaOrigen = cuentaOrigenDoc.data() as {
    tipo: 'debito' | 'credito'
    saldoActual: number
    cupoDisponible?: number
  }
  
  // 3. Calcular y actualizar saldo según el tipo de movimiento
  if (datos.tipo === 'ingreso') {
    // Sumar a la cuenta
    const ajuste = calcularAjusteCuenta(cuentaOrigen, datos.monto, true)
    batch.update(refCuenta(userId, datos.cuentaId), ajuste)
  } else if (datos.tipo === 'egreso') {
    // Restar de la cuenta
    const ajuste = calcularAjusteCuenta(cuentaOrigen, datos.monto, false)
    batch.update(refCuenta(userId, datos.cuentaId), ajuste)
  } else if (datos.tipo === 'transferencia') {
    // Restar de origen
    const ajusteOrigen = calcularAjusteCuenta(cuentaOrigen, datos.monto, false)
    batch.update(refCuenta(userId, datos.cuentaId), ajusteOrigen)
    
    // Sumar al destino
    if (!datos.cuentaDestinoId) {
      throw new Error('Cuenta destino requerida para transferencia')
    }
    const cuentaDestinoDoc = cuentaOrigenSnapshot.docs.find(
      (d) => d.id === datos.cuentaDestinoId
    )
    if (!cuentaDestinoDoc) {
      throw new Error('Cuenta destino no encontrada')
    }
    const cuentaDestino = cuentaDestinoDoc.data() as {
      tipo: 'debito' | 'credito'
      saldoActual: number
      cupoDisponible?: number
    }
    const ajusteDestino = calcularAjusteCuenta(cuentaDestino, datos.monto, true)
    batch.update(refCuenta(userId, datos.cuentaDestinoId), ajusteDestino)
  }
  
  // 4. Ejecutar todo atómicamente
  await batch.commit()
  
  return movimientoRef.id
}

/**
 * Elimina un movimiento y revierte el ajuste en los saldos.
 */
export async function eliminarMovimiento(
  userId: string,
  movimiento: Movimiento
): Promise<void> {
  const batch = writeBatch(db)
  
  // 1. Eliminar el movimiento
  const movimientoRef = doc(db, 'usuarios', userId, 'movimientos', movimiento.id)
  batch.delete(movimientoRef)
  
  // 2. Revertir el saldo de la cuenta origen
  const cuentasSnapshot = await getDocs(collection(db, 'usuarios', userId, 'cuentas'))
  const cuentaOrigenDoc = cuentasSnapshot.docs.find((d) => d.id === movimiento.cuentaId)
  
  if (cuentaOrigenDoc) {
    const cuentaOrigen = cuentaOrigenDoc.data() as {
      tipo: 'debito' | 'credito'
      saldoActual: number
      cupoDisponible?: number
    }
    
    // Reversa: si fue ingreso → restar; si fue egreso → sumar
    const esReversaIngreso = movimiento.tipo === 'egreso'
    const ajuste = calcularAjusteCuenta(cuentaOrigen, movimiento.monto, esReversaIngreso)
    batch.update(refCuenta(userId, movimiento.cuentaId), ajuste)
  }
  
  // 3. Si era transferencia, revertir también el destino
  if (movimiento.tipo === 'transferencia' && movimiento.cuentaDestinoId) {
    const cuentaDestinoDoc = cuentasSnapshot.docs.find(
      (d) => d.id === movimiento.cuentaDestinoId
    )
    if (cuentaDestinoDoc) {
      const cuentaDestino = cuentaDestinoDoc.data() as {
        tipo: 'debito' | 'credito'
        saldoActual: number
        cupoDisponible?: number
      }
      // Reversa de transferencia: restar del destino
      const ajusteDestino = calcularAjusteCuenta(cuentaDestino, movimiento.monto, false)
      batch.update(refCuenta(userId, movimiento.cuentaDestinoId), ajusteDestino)
    }
  }
  
  await batch.commit()
}