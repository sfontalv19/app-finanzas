import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Categoria } from '../types'
import type { CategoriaFormData } from '../lib/schemas'

/**
 * Construye la referencia a la colección de categorías de un usuario.
 * Path: usuarios/{userId}/categorias
 */
function refCategorias(userId: string) {
  return collection(db, 'usuarios', userId, 'categorias')
}

/**
 * Obtiene todas las categorías de un usuario.
 */
export async function obtenerCategorias(userId: string): Promise<Categoria[]> {
  const snapshot = await getDocs(refCategorias(userId))
  
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      nombre: data.nombre,
      tipo: data.tipo,
      icono: data.icono,
      color: data.color,
      esPredefinida: data.esPredefinida ?? false,
    }
  })
}

/**
 * Crea una nueva categoría.
 */
export async function crearCategoria(
  userId: string,
  datos: CategoriaFormData
): Promise<string> {
  const docRef = await addDoc(refCategorias(userId), {
    ...datos,
    esPredefinida: false,
    creadaEn: serverTimestamp(),
  })
  return docRef.id
}

/**
 * Actualiza una categoría existente.
 */
export async function actualizarCategoria(
  userId: string,
  categoriaId: string,
  datos: CategoriaFormData
): Promise<void> {
  const docRef = doc(db, 'usuarios', userId, 'categorias', categoriaId)
  await updateDoc(docRef, { ...datos })
}

/**
 * Elimina una categoría.
 */
export async function eliminarCategoria(
  userId: string,
  categoriaId: string
): Promise<void> {
  const docRef = doc(db, 'usuarios', userId, 'categorias', categoriaId)
  await deleteDoc(docRef)
}

/**
 * Crea las categorías predefinidas para un usuario nuevo.
 * Se llama una sola vez al registrarse.
 */
export async function crearCategoriasPredefinidas(userId: string): Promise<void> {
  const predefinidas: Omit<Categoria, 'id'>[] = [
    // Egresos
    { nombre: 'Comida', tipo: 'egreso', icono: 'utensils', color: '#EF4444', esPredefinida: true },
    { nombre: 'Transporte', tipo: 'egreso', icono: 'car', color: '#F59E0B', esPredefinida: true },
    { nombre: 'Ropa', tipo: 'egreso', icono: 'shirt', color: '#EC4899', esPredefinida: true },
    { nombre: 'Salud', tipo: 'egreso', icono: 'heart', color: '#10B981', esPredefinida: true },
    { nombre: 'Entretenimiento', tipo: 'egreso', icono: 'film', color: '#8B5CF6', esPredefinida: true },
    { nombre: 'Servicios', tipo: 'egreso', icono: 'zap', color: '#06B6D4', esPredefinida: true },
    { nombre: 'Hogar', tipo: 'egreso', icono: 'home', color: '#84CC16', esPredefinida: true },
    { nombre: 'Otros gastos', tipo: 'egreso', icono: 'more-horizontal', color: '#6B7280', esPredefinida: true },
    // Ingresos
    { nombre: 'Salario', tipo: 'ingreso', icono: 'briefcase', color: '#10B981', esPredefinida: true },
    { nombre: 'Freelance', tipo: 'ingreso', icono: 'laptop', color: '#3B82F6', esPredefinida: true },
    { nombre: 'Regalo', tipo: 'ingreso', icono: 'gift', color: '#EC4899', esPredefinida: true },
    { nombre: 'Otros ingresos', tipo: 'ingreso', icono: 'plus-circle', color: '#6B7280', esPredefinida: true },
  ]
  
  // writeBatch agrupa varias escrituras en una sola operación
  const batch = writeBatch(db)
  
  predefinidas.forEach((categoria) => {
    const nuevaRef = doc(refCategorias(userId))
    batch.set(nuevaRef, {
      ...categoria,
      creadaEn: serverTimestamp(),
    })
  })
  
  await batch.commit()
}