import {
  collection,
  doc,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { CompraCuotas } from '../types'
import type { MovimientoFormData } from '../lib/schemas'

/**
 * Construye la referencia a la colección de compras a cuotas de un usuario.
 */
function refComprasCuotas(userId: string) {
  return collection(db, 'usuarios', userId, 'comprasCuotas')
}

/**
 * Obtiene todas las compras a cuotas del usuario.
 */
export async function obtenerComprasCuotas(userId: string): Promise<CompraCuotas[]> {
  const snapshot = await getDocs(refComprasCuotas(userId))
  
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      cuentaId: data.cuentaId,
      montoTotal: data.montoTotal,
      numeroCuotas: data.numeroCuotas,
      valorCuota: data.valorCuota,
      tieneIntereses: data.tieneIntereses ?? false,
      categoriaId: data.categoriaId,
      descripcion: data.descripcion,
      fechaCompra: data.fechaCompra?.toDate() ?? new Date(),
      primerMesPago: data.primerMesPago?.toDate() ?? new Date(),
      cuotasPagadas: data.cuotasPagadas ?? 0,
      cuotasRestantes: data.cuotasRestantes ?? data.numeroCuotas,
      activa: data.activa ?? true,
    }
  })
}

/**
 * Crea una compra a cuotas:
 *  1. Crea el documento en comprasCuotas
 *  2. Crea el movimiento de egreso vinculado
 *  3. Actualiza el cupoDisponible de la tarjeta (baja el monto total)
 * Todo en una sola operación atómica.
 */
export async function crearCompraCuotas(
  userId: string,
  datos: MovimientoFormData
): Promise<string> {
  if (!datos.numeroCuotas || !datos.categoriaId) {
    throw new Error('Datos incompletos para compra a cuotas')
  }
  
  // Calcular valor cuota: si tiene intereses lo dio el usuario, si no lo calculamos
  const valorCuota = datos.tieneIntereses
    ? (datos.valorCuota ?? 0)
    : datos.monto / datos.numeroCuotas
  
  // Calcular primer mes de pago: el siguiente mes a la compra
  const fechaCompra = datos.fecha
  const primerMesPago = new Date(
    fechaCompra.getFullYear(),
    fechaCompra.getMonth() + 1,
    1
  )
  
  const batch = writeBatch(db)
  
  // 1. Crear el documento de compra a cuotas
  const compraRef = doc(refComprasCuotas(userId))
  batch.set(compraRef, {
    cuentaId: datos.cuentaId,
    montoTotal: datos.monto,
    numeroCuotas: datos.numeroCuotas,
    valorCuota,
    tieneIntereses: datos.tieneIntereses ?? false,
    categoriaId: datos.categoriaId,
    descripcion: datos.descripcion,
    fechaCompra: Timestamp.fromDate(fechaCompra),
    primerMesPago: Timestamp.fromDate(primerMesPago),
    cuotasPagadas: 0,
    cuotasRestantes: datos.numeroCuotas,
    activa: true,
    creadoEn: serverTimestamp(),
  })
  
  // 2. Crear el movimiento de egreso vinculado
  const movimientoRef = doc(collection(db, 'usuarios', userId, 'movimientos'))
  batch.set(movimientoRef, {
    tipo: 'egreso',
    monto: datos.monto,
    cuentaId: datos.cuentaId,
    cuentaDestinoId: null,
    categoriaId: datos.categoriaId,
    descripcion: datos.descripcion,
    fecha: Timestamp.fromDate(fechaCompra),
    creadoEn: serverTimestamp(),
    compraCuotasId: compraRef.id,
  })
  
  // 3. Actualizar el cupo disponible de la tarjeta
  const cuentasSnapshot = await getDocs(collection(db, 'usuarios', userId, 'cuentas'))
  const tarjetaDoc = cuentasSnapshot.docs.find((d) => d.id === datos.cuentaId)
  
  if (!tarjetaDoc) {
    throw new Error('Tarjeta no encontrada')
  }
  
  const tarjeta = tarjetaDoc.data() as { cupoDisponible?: number }
  const cupoActual = tarjeta.cupoDisponible ?? 0
  
  // VALIDAR: el cupo disponible debe alcanzar el monto total
  if (cupoActual < datos.monto) {
    throw new Error(
      `Cupo insuficiente. Tu tarjeta tiene $${cupoActual.toLocaleString('es-CO')} de cupo disponible y estás intentando comprar $${datos.monto.toLocaleString('es-CO')}.`
    )
  }
  
  const tarjetaRef = doc(db, 'usuarios', userId, 'cuentas', datos.cuentaId)
  batch.update(tarjetaRef, {
    cupoDisponible: cupoActual - datos.monto,
  })
  
  await batch.commit()
  
  return compraRef.id
}

/**
 * Marca una cuota como pagada y registra el movimiento de pago.
 */
export async function pagarCuota(
  userId: string,
  compraCuotas: CompraCuotas,
  cuentaPagoId: string
): Promise<void> {
  const batch = writeBatch(db)
  
  // Calcular nuevos valores
  const nuevasPagadas = compraCuotas.cuotasPagadas + 1
  const nuevasRestantes = compraCuotas.cuotasRestantes - 1
  const yaCompletada = nuevasRestantes <= 0
  
  // 1. Actualizar la compra a cuotas
  const compraRef = doc(db, 'usuarios', userId, 'comprasCuotas', compraCuotas.id)
  batch.update(compraRef, {
    cuotasPagadas: nuevasPagadas,
    cuotasRestantes: nuevasRestantes,
    activa: !yaCompletada,
  })
  
  // 2. Crear el movimiento de pago (egreso de la cuenta de pago)
  const movimientoRef = doc(collection(db, 'usuarios', userId, 'movimientos'))
  batch.set(movimientoRef, {
    tipo: 'egreso',
    monto: compraCuotas.valorCuota,
    cuentaId: cuentaPagoId,
    cuentaDestinoId: null,
    categoriaId: compraCuotas.categoriaId,
    descripcion: `Cuota ${nuevasPagadas}/${compraCuotas.numeroCuotas} - ${compraCuotas.descripcion}`,
    fecha: Timestamp.fromDate(new Date()),
    creadoEn: serverTimestamp(),
    compraCuotasId: compraCuotas.id,
  })
  
  // 3. Actualizar saldos: bajar de la cuenta de pago, subir el cupo de la tarjeta
  const cuentasSnapshot = await getDocs(collection(db, 'usuarios', userId, 'cuentas'))
  
  // Bajar de la cuenta de pago
  const cuentaPagoDoc = cuentasSnapshot.docs.find((d) => d.id === cuentaPagoId)
  if (cuentaPagoDoc) {
    const cuentaPago = cuentaPagoDoc.data() as {
      tipo: 'debito' | 'credito'
      saldoActual: number
      cupoDisponible?: number
    }
    const cuentaPagoRef = doc(db, 'usuarios', userId, 'cuentas', cuentaPagoId)
    if (cuentaPago.tipo === 'debito') {
      // VALIDAR: saldo suficiente en cuenta de débito
      if (cuentaPago.saldoActual < compraCuotas.valorCuota) {
        throw new Error(
          `Saldo insuficiente. La cuenta tiene $${cuentaPago.saldoActual.toLocaleString('es-CO')} y la cuota es de $${compraCuotas.valorCuota.toLocaleString('es-CO')}.`
        )
      }
      batch.update(cuentaPagoRef, {
        saldoActual: cuentaPago.saldoActual - compraCuotas.valorCuota,
      })
    } else {
      // VALIDAR: cupo suficiente en tarjeta
      if ((cuentaPago.cupoDisponible ?? 0) < compraCuotas.valorCuota) {
        throw new Error(
          `Cupo insuficiente en la tarjeta de pago.`
        )
      }
      batch.update(cuentaPagoRef, {
        cupoDisponible: (cuentaPago.cupoDisponible ?? 0) - compraCuotas.valorCuota,
      })
    }
  }
  
  // Subir el cupo de la tarjeta de la compra
  const tarjetaDoc = cuentasSnapshot.docs.find((d) => d.id === compraCuotas.cuentaId)
  if (tarjetaDoc) {
    const tarjeta = tarjetaDoc.data() as { cupoDisponible?: number }
    const tarjetaRef = doc(db, 'usuarios', userId, 'cuentas', compraCuotas.cuentaId)
    batch.update(tarjetaRef, {
      cupoDisponible: (tarjeta.cupoDisponible ?? 0) + compraCuotas.valorCuota,
    })
  }
  
  await batch.commit()
}
/**
 * Actualiza una compra a cuotas existente.
 * Lógica: revertir el efecto viejo en el cupo, aplicar el nuevo, 
 * actualizar el movimiento vinculado.
 * Todo atómico.
 */
export async function actualizarCompraCuotas(
  userId: string,
  compraOriginal: CompraCuotas,
  datosNuevos: {
    montoTotal: number
    numeroCuotas: number
    valorCuota?: number
    tieneIntereses: boolean
    categoriaId: string
    descripcion: string
  }
): Promise<void> {
  const batch = writeBatch(db)
  
  // Calcular nuevo valor cuota
  const nuevoValorCuota = Math.round(
    datosNuevos.tieneIntereses
      ? (datosNuevos.valorCuota ?? 0)
      : datosNuevos.montoTotal / datosNuevos.numeroCuotas
  )
  
  const nuevoMontoTotal = Math.round(datosNuevos.montoTotal)
  
  // 1. Calcular la diferencia en el cupo de la tarjeta
  // La compra vieja ocupaba X cupo, la nueva ocupa Y cupo
  // pero hay que considerar las cuotas que ya se pagaron
  const cuotasYaPagadas = compraOriginal.cuotasPagadas
  const valorViejoQueAfectaCupo = compraOriginal.valorCuota * (compraOriginal.numeroCuotas - cuotasYaPagadas)
  const valorNuevoQueAfectaCupo = nuevoValorCuota * (datosNuevos.numeroCuotas - cuotasYaPagadas)
  const diferenciaCupo = valorViejoQueAfectaCupo - valorNuevoQueAfectaCupo
  
  // 2. Aplicar la diferencia al cupo de la tarjeta
  const cuentasSnapshot = await getDocs(collection(db, 'usuarios', userId, 'cuentas'))
  const tarjetaDoc = cuentasSnapshot.docs.find((d) => d.id === compraOriginal.cuentaId)
  
  if (!tarjetaDoc) {
    throw new Error('Tarjeta no encontrada')
  }
  
  const tarjeta = tarjetaDoc.data() as { cupoDisponible?: number }
  const cupoActual = tarjeta.cupoDisponible ?? 0
  const nuevoCupo = Math.round(cupoActual + diferenciaCupo)
  
  // Validar que el cupo no quede negativo
  if (nuevoCupo < 0) {
    throw new Error(
      `Cupo insuficiente. Con este cambio la tarjeta quedaría con cupo $${nuevoCupo.toLocaleString('es-CO')}.`
    )
  }
  
  const tarjetaRef = doc(db, 'usuarios', userId, 'cuentas', compraOriginal.cuentaId)
  batch.update(tarjetaRef, { cupoDisponible: nuevoCupo })
  
  // 3. Actualizar el documento de la compra a cuotas
  const compraRef = doc(db, 'usuarios', userId, 'comprasCuotas', compraOriginal.id)
  batch.update(compraRef, {
    montoTotal: nuevoMontoTotal,
    numeroCuotas: datosNuevos.numeroCuotas,
    valorCuota: nuevoValorCuota,
    tieneIntereses: datosNuevos.tieneIntereses,
    categoriaId: datosNuevos.categoriaId,
    descripcion: datosNuevos.descripcion,
    cuotasRestantes: datosNuevos.numeroCuotas - cuotasYaPagadas,
  })
  
  // 4. Buscar y actualizar el movimiento vinculado original (si existe)
  const movimientosQuery = query(
    collection(db, 'usuarios', userId, 'movimientos'),
    where('compraCuotasId', '==', compraOriginal.id)
  )
  const movimientosSnapshot = await getDocs(movimientosQuery)
  
  // Actualizar el movimiento original de la compra (no las cuotas ya pagadas)
  // El movimiento "original" es el que tiene la misma descripción y no es una cuota
  const movimientoOriginal = movimientosSnapshot.docs.find((d) => {
    const data = d.data()
    return !data.descripcion.startsWith('Cuota ')
  })
  
  if (movimientoOriginal) {
    batch.update(movimientoOriginal.ref, {
      monto: nuevoMontoTotal,
      categoriaId: datosNuevos.categoriaId,
      descripcion: datosNuevos.descripcion,
    })
  }
  
  await batch.commit()
}

/**
 * Elimina una compra a cuotas y revierte su efecto en los saldos.
 * - Devuelve al cupo de la tarjeta el monto que aún no se ha pagado
 * - Elimina el movimiento original vinculado
 * - NO toca los movimientos de las cuotas ya pagadas (esas son egresos reales del pasado)
 * - Elimina el documento de la compra
 */
export async function eliminarCompraCuotas(
  userId: string,
  compra: CompraCuotas
): Promise<void> {
  const batch = writeBatch(db)
  
  // 1. Calcular cuánto debemos devolver al cupo
  // Solo lo que falta por pagar (las cuotas ya pagadas son gastos reales del pasado)
  const cuotasRestantes = compra.numeroCuotas - compra.cuotasPagadas
  const montoADevolverAlCupo = Math.round(compra.valorCuota * cuotasRestantes)
  
  // 2. Devolver al cupo de la tarjeta
  const cuentasSnapshot = await getDocs(collection(db, 'usuarios', userId, 'cuentas'))
  const tarjetaDoc = cuentasSnapshot.docs.find((d) => d.id === compra.cuentaId)
  
  if (tarjetaDoc) {
    const tarjeta = tarjetaDoc.data() as { cupoDisponible?: number }
    const cupoActual = tarjeta.cupoDisponible ?? 0
    const tarjetaRef = doc(db, 'usuarios', userId, 'cuentas', compra.cuentaId)
    batch.update(tarjetaRef, {
      cupoDisponible: Math.round(cupoActual + montoADevolverAlCupo),
    })
  }
  
  // 3. Eliminar el documento de la compra a cuotas
  const compraRef = doc(db, 'usuarios', userId, 'comprasCuotas', compra.id)
  batch.delete(compraRef)
  
  // 4. Eliminar SOLO el movimiento original vinculado (no las cuotas ya pagadas)
  const movimientosQuery = query(
    collection(db, 'usuarios', userId, 'movimientos'),
    where('compraCuotasId', '==', compra.id)
  )
  const movimientosSnapshot = await getDocs(movimientosQuery)
  
  for (const movDoc of movimientosSnapshot.docs) {
    const data = movDoc.data()
    // Solo eliminamos el movimiento original (no las cuotas pagadas)
    if (!data.descripcion.startsWith('Cuota ')) {
      batch.delete(movDoc.ref)
    }
  }
  
  await batch.commit()
}
