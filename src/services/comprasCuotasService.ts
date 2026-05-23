import {
  collection,
  doc,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
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
      batch.update(cuentaPagoRef, {
        saldoActual: cuentaPago.saldoActual - compraCuotas.valorCuota,
      })
    } else {
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