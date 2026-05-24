import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Cuenta } from '../types'
import type { CuentaFormData } from '../lib/schemas'

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
  const datosCuenta: Record<string, unknown> = {
    nombre: datos.nombre,
    tipo: datos.tipo,
    color: datos.color,
    icono: datos.icono,
    archivada: false,
    creadaEn: serverTimestamp(),
  }
  
  if (datos.tipo === 'debito') {
    const saldo = Math.round(datos.saldoInicial)
    datosCuenta.saldoInicial = saldo
    datosCuenta.saldoActual = saldo
  } else {
    const cupoTotal = Math.round(datos.cupoTotal ?? 0)
    const deuda = Math.round(datos.saldoInicial)
    
    datosCuenta.saldoInicial = deuda
    datosCuenta.saldoActual = 0
    datosCuenta.cupoTotal = cupoTotal
    datosCuenta.cupoDisponible = cupoTotal - deuda
  }
  
  const docRef = await addDoc(refCuentas(userId), datosCuenta)
  return docRef.id
}

/**
 * Actualiza una cuenta existente (modo "edición libre").
 * Permite editar nombre, color, ícono, saldo/deuda y cupo total.
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
  
  if (datos.tipo === 'debito') {
    // Para débito: editar libremente el saldo actual
    const nuevoSaldo = Math.round(datos.saldoInicial)
    datosActualizar.saldoActual = nuevoSaldo
  } else {
    // Para crédito: el "saldoInicial" del formulario representa la deuda actual
    const nuevoCupoTotal = Math.round(datos.cupoTotal ?? 0)
    const nuevaDeuda = Math.round(datos.saldoInicial)
    datosActualizar.cupoTotal = nuevoCupoTotal
    datosActualizar.cupoDisponible = nuevoCupoTotal - nuevaDeuda
  }
  
  await updateDoc(docRef, datosActualizar)
}

/**
 * "Elimina" una cuenta (visualmente).
 * - Si la cuenta NO tiene movimientos: la borra de verdad de Firestore.
 * - Si tiene movimientos: la archiva (queda invisible pero preserva el histórico).
 * 
 * Esto se llama desde el botón "Eliminar cuenta" en la UI.
 */
export async function eliminarCuenta(
  userId: string,
  cuentaId: string
): Promise<void> {
  // 1. Verificar si tiene movimientos asociados (como cuenta origen o destino)
  const movimientosRef = collection(db, 'usuarios', userId, 'movimientos')
  
  const queryOrigen = query(
    movimientosRef,
    where('cuentaId', '==', cuentaId),
    limit(1)
  )
  const queryDestino = query(
    movimientosRef,
    where('cuentaDestinoId', '==', cuentaId),
    limit(1)
  )
  
  const [snapOrigen, snapDestino] = await Promise.all([
    getDocs(queryOrigen),
    getDocs(queryDestino),
  ])
  
  const tieneMovimientos = !snapOrigen.empty || !snapDestino.empty
  
  const docRef = doc(db, 'usuarios', userId, 'cuentas', cuentaId)
  
  if (tieneMovimientos) {
    // Tiene historial: solo marcamos como archivada (no se borra de verdad)
    await updateDoc(docRef, { archivada: true })
  } else {
    // No tiene historial: la podemos borrar de verdad
    await deleteDoc(docRef)
  }
}
