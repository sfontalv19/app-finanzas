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
  const montoEntero = Math.round(monto)
  
  // Si es débito: ajusta saldoActual
  if (cuentaActual.tipo === 'debito') {
    const delta = esIngresoEnCuenta ? montoEntero : -montoEntero
    return { saldoActual: Math.round(cuentaActual.saldoActual + delta) }
  }
  
  // Si es crédito: ajusta cupoDisponible
  const cupoDisponibleActual = cuentaActual.cupoDisponible ?? 0
  const delta = esIngresoEnCuenta ? montoEntero : -montoEntero
  return { cupoDisponible: Math.round(cupoDisponibleActual + delta) }
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
    monto: Math.round(datos.monto),
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
    // VALIDAR SALDO SUFICIENTE para cuentas de débito
    if (cuentaOrigen.tipo === 'debito' && cuentaOrigen.saldoActual < datos.monto) {
      throw new Error(
        `Saldo insuficiente. Tu cuenta tiene $${cuentaOrigen.saldoActual.toLocaleString('es-CO')} y estás intentando gastar $${datos.monto.toLocaleString('es-CO')}.`
      )
    }
    // VALIDAR CUPO DISPONIBLE para tarjetas de crédito
    if (cuentaOrigen.tipo === 'credito' && (cuentaOrigen.cupoDisponible ?? 0) < datos.monto) {
      throw new Error(
        `Cupo insuficiente. Tu tarjeta tiene $${(cuentaOrigen.cupoDisponible ?? 0).toLocaleString('es-CO')} de cupo disponible y estás intentando gastar $${datos.monto.toLocaleString('es-CO')}.`
      )
    }
    // Restar de la cuenta
    const ajuste = calcularAjusteCuenta(cuentaOrigen, datos.monto, false)
    batch.update(refCuenta(userId, datos.cuentaId), ajuste)
  } else if (datos.tipo === 'transferencia') {
    // VALIDAR SALDO SUFICIENTE en cuenta origen
    if (cuentaOrigen.tipo === 'debito' && cuentaOrigen.saldoActual < datos.monto) {
      throw new Error(
        `Saldo insuficiente. La cuenta origen tiene $${cuentaOrigen.saldoActual.toLocaleString('es-CO')} y estás transfiriendo $${datos.monto.toLocaleString('es-CO')}.`
      )
    }
    if (cuentaOrigen.tipo === 'credito' && (cuentaOrigen.cupoDisponible ?? 0) < datos.monto) {
      throw new Error(
        `Cupo insuficiente en la tarjeta origen.`
      )
    }
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

/**
 * Actualiza un movimiento existente.
 * Lógica: revertir el efecto del movimiento viejo, luego aplicar el nuevo.
 * Todo atómico.
 */
export async function actualizarMovimiento(
  userId: string,
  movimientoOriginal: Movimiento,
  datosNuevos: MovimientoFormData
): Promise<void> {
  const batch = writeBatch(db)
  
  // Traer todas las cuentas una sola vez
  const cuentasSnapshot = await getDocs(collection(db, 'usuarios', userId, 'cuentas'))
  
  // Helper para encontrar y leer una cuenta
  const leerCuenta = (cuentaId: string) => {
    const docCuenta = cuentasSnapshot.docs.find((d) => d.id === cuentaId)
    if (!docCuenta) return null
    return {
      ref: refCuenta(userId, cuentaId),
      data: docCuenta.data() as {
        tipo: 'debito' | 'credito'
        saldoActual: number
        cupoDisponible?: number
      },
    }
  }
  
  // Acumulamos los ajustes por cuenta para poder combinarlos
  // (ej. si la nueva cuenta es la misma que la vieja, sumamos los deltas)
  const ajustesPorCuenta = new Map<string, { delta: number; tipo: 'debito' | 'credito' }>()
  
  const agregarAjuste = (
    cuentaId: string,
    monto: number,
    esIngreso: boolean,
    tipoCuenta: 'debito' | 'credito'
  ) => {
    const montoRedondeado = Math.round(monto)
    const delta = esIngreso ? montoRedondeado : -montoRedondeado
    const actual = ajustesPorCuenta.get(cuentaId)
    ajustesPorCuenta.set(cuentaId, {
      delta: (actual?.delta ?? 0) + delta,
      tipo: tipoCuenta,
    })
  }
  
  // 1. REVERTIR el movimiento original
  const cuentaOrigenVieja = leerCuenta(movimientoOriginal.cuentaId)
  if (cuentaOrigenVieja) {
    // Reversa: si fue ingreso → restar (esIngreso=false), si fue egreso → sumar (esIngreso=true)
    const esReversaIngreso = movimientoOriginal.tipo === 'egreso'
    agregarAjuste(
      movimientoOriginal.cuentaId,
      movimientoOriginal.monto,
      esReversaIngreso,
      cuentaOrigenVieja.data.tipo
    )
  }
  
  if (movimientoOriginal.tipo === 'transferencia' && movimientoOriginal.cuentaDestinoId) {
    const cuentaDestinoVieja = leerCuenta(movimientoOriginal.cuentaDestinoId)
    if (cuentaDestinoVieja) {
      // El destino de la transferencia vieja debe restarse
      agregarAjuste(
        movimientoOriginal.cuentaDestinoId,
        movimientoOriginal.monto,
        false,
        cuentaDestinoVieja.data.tipo
      )
    }
  }
  
  // 2. APLICAR el movimiento nuevo
  const cuentaOrigenNueva = leerCuenta(datosNuevos.cuentaId)
  if (!cuentaOrigenNueva) {
    throw new Error('Cuenta origen nueva no encontrada')
  }
  
  if (datosNuevos.tipo === 'ingreso') {
    agregarAjuste(datosNuevos.cuentaId, datosNuevos.monto, true, cuentaOrigenNueva.data.tipo)
  } else if (datosNuevos.tipo === 'egreso') {
    agregarAjuste(datosNuevos.cuentaId, datosNuevos.monto, false, cuentaOrigenNueva.data.tipo)
  } else if (datosNuevos.tipo === 'transferencia') {
    if (!datosNuevos.cuentaDestinoId) {
      throw new Error('Cuenta destino requerida para transferencia')
    }
    const cuentaDestinoNueva = leerCuenta(datosNuevos.cuentaDestinoId)
    if (!cuentaDestinoNueva) {
      throw new Error('Cuenta destino nueva no encontrada')
    }
    agregarAjuste(datosNuevos.cuentaId, datosNuevos.monto, false, cuentaOrigenNueva.data.tipo)
    agregarAjuste(datosNuevos.cuentaDestinoId, datosNuevos.monto, true, cuentaDestinoNueva.data.tipo)
  }
  
  // 3. Aplicar todos los ajustes acumulados al batch
  // Pero antes validamos que los saldos finales no queden negativos
  for (const [cuentaId, ajuste] of ajustesPorCuenta) {
    const cuenta = leerCuenta(cuentaId)
    if (!cuenta) continue
    
    if (ajuste.tipo === 'debito') {
      const saldoFinal = Math.round(cuenta.data.saldoActual + ajuste.delta)
      // VALIDAR: el saldo final no puede ser negativo
      if (saldoFinal < 0) {
        throw new Error(
          `Saldo insuficiente. Con este cambio la cuenta quedaría en $${saldoFinal.toLocaleString('es-CO')}.`
        )
      }
      batch.update(cuenta.ref, { saldoActual: saldoFinal })
    } else {
      const cupoFinal = Math.round((cuenta.data.cupoDisponible ?? 0) + ajuste.delta)
      // VALIDAR: el cupo final no puede ser negativo
      if (cupoFinal < 0) {
        throw new Error(
          `Cupo insuficiente. Con este cambio la tarjeta quedaría con cupo $${cupoFinal.toLocaleString('es-CO')}.`
        )
      }
      batch.update(cuenta.ref, { cupoDisponible: cupoFinal })
    }
  }
  
  // 4. Actualizar el documento del movimiento
  const movimientoRef = doc(db, 'usuarios', userId, 'movimientos', movimientoOriginal.id)
  batch.update(movimientoRef, {
    tipo: datosNuevos.tipo,
    monto: Math.round(datosNuevos.monto),
    cuentaId: datosNuevos.cuentaId,
    cuentaDestinoId: datosNuevos.cuentaDestinoId ?? null,
    categoriaId: datosNuevos.categoriaId ?? null,
    descripcion: datosNuevos.descripcion,
    fecha: Timestamp.fromDate(datosNuevos.fecha),
  })
  
  await batch.commit()
}
