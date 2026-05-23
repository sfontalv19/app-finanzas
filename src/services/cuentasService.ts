import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Cuenta } from '../types'
import type { CuentaFormData } from '../lib/schemas'

/**
 * Construye la referencia a la colección de cuentas de un usuario.
 * Path: usuarios/{userId}/cuentas
 */
function refCuentas(userId: string) {
  return collection(db, 'usuarios', userId, 'cuentas')
}

/**
 * Obtiene todas las cuentas de un usuario.
 */
export async function obtenerCuentas(userId: string): Promise<Cuenta[]> {
  const snapshot = await getDocs(refCuentas(userId))
  
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      nombre: data.nombre,
      tipo: data.tipo,
      saldoInicial: data.saldoInicial,
      saldoActual: data.saldoActual,
      cupoTotal: data.cupoTotal,
      cupoDisponible: data.cupoDisponible,
      color: data.color,
      icono: data.icono,
      creadaEn: data.creadaEn?.toDate() ?? new Date(),
      archivada: data.archivada ?? false,
    }
  })
}

/**
 * Obtiene una cuenta específica por ID.
 */
export async function obtenerCuenta(
  userId: string,
  cuentaId: string
): Promise<Cuenta | null> {
  const docRef = doc(db, 'usuarios', userId, 'cuentas', cuentaId)
  const snapshot = await getDoc(docRef)
  
  if (!snapshot.exists()) return null
  
  const data = snapshot.data()
  return {
    id: snapshot.id,
    nombre: data.nombre,
    tipo: data.tipo,
    saldoInicial: data.saldoInicial,
    saldoActual: data.saldoActual,
    cupoTotal: data.cupoTotal,
    cupoDisponible: data.cupoDisponible,
    color: data.color,
    icono: data.icono,
    creadaEn: data.creadaEn?.toDate() ?? new Date(),
    archivada: data.archivada ?? false,
  }
}

/**
 * Crea una nueva cuenta.
 */
export async function crearCuenta(
  userId: string,
  datos: CuentaFormData
): Promise<string> {
  // Lógica especial según tipo de cuenta
  const datosCuenta: Record<string, unknown> = {
    nombre: datos.nombre,
    tipo: datos.tipo,
    color: datos.color,
    icono: datos.icono,
    archivada: false,
    creadaEn: serverTimestamp(),
  }
  
  if (datos.tipo === 'debito') {
    // Para débito: saldoInicial = saldoActual
    datosCuenta.saldoInicial = datos.saldoInicial
    datosCuenta.saldoActual = datos.saldoInicial
  } else {
    // Para crédito: saldoInicial representa la deuda actual
    const cupoTotal = datos.cupoTotal ?? 0
    const deuda = datos.saldoInicial
    
    datosCuenta.saldoInicial = deuda
    datosCuenta.saldoActual = 0 // no aplica para crédito, se maneja con cupo
    datosCuenta.cupoTotal = cupoTotal
    datosCuenta.cupoDisponible = cupoTotal - deuda
  }
  
  const docRef = await addDoc(refCuentas(userId), datosCuenta)
  return docRef.id
}

/**
 * Actualiza una cuenta existente.
 * Nota: no toca los saldos actuales, solo edita info "estática".
 * Los saldos se modifican vía movimientos.
 */
export async function actualizarCuenta(
  userId: string,
  cuentaId: string,
  datos: CuentaFormData
): Promise<void> {
  const docRef = doc(db, 'usuarios', userId, 'cuentas', cuentaId)
  
  const datosActualizar: Record<string, unknown> = {
    nombre: datos.nombre,
    color: datos.color,
    icono: datos.icono,
  }
  
  // Si es crédito, permitir actualizar el cupo total
  if (datos.tipo === 'credito' && datos.cupoTotal !== undefined) {
    // Al cambiar el cupo total, hay que recalcular el cupo disponible
    // manteniendo la deuda actual
    const cuentaActual = await obtenerCuenta(userId, cuentaId)
    if (cuentaActual) {
      const deudaActual = (cuentaActual.cupoTotal ?? 0) - (cuentaActual.cupoDisponible ?? 0)
      datosActualizar.cupoTotal = datos.cupoTotal
      datosActualizar.cupoDisponible = datos.cupoTotal - deudaActual
    }
  }
  
  await updateDoc(docRef, datosActualizar)
}

/**
 * Archiva una cuenta (no la borra, solo la marca como archivada).
 * No usamos delete para no perder el histórico de movimientos.
 */
export async function archivarCuenta(
  userId: string,
  cuentaId: string
): Promise<void> {
  const docRef = doc(db, 'usuarios', userId, 'cuentas', cuentaId)
  await updateDoc(docRef, { archivada: true })
}

/**
 * Desarchiva una cuenta (la vuelve a activar).
 */
export async function desarchivarCuenta(
  userId: string,
  cuentaId: string
): Promise<void> {
  const docRef = doc(db, 'usuarios', userId, 'cuentas', cuentaId)
  await updateDoc(docRef, { archivada: false })
}