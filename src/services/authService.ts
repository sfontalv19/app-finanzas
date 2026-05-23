import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type UserCredential,
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { crearCategoriasPredefinidas } from './categoriasService'

/**
 * Registra un nuevo usuario con email y contraseña.
 * También guarda el nombre en el perfil.
 */
export async function registrarUsuario(
  email: string,
  password: string,
  nombre: string
): Promise<UserCredential> {
  const credencial = await createUserWithEmailAndPassword(auth, email, password)
  
  // Guardar el nombre en el perfil del usuario
  await updateProfile(credencial.user, { displayName: nombre })
  
  // Crear categorías predefinidas para el nuevo usuario
  await crearCategoriasPredefinidas(credencial.user.uid)
  
  return credencial
}

/**
 * Inicia sesión con email y contraseña.
 */
export async function iniciarSesion(
  email: string,
  password: string
): Promise<UserCredential> {
  return await signInWithEmailAndPassword(auth, email, password)
}

/**
 * Inicia sesión con Google (abre un popup).
 */
export async function iniciarSesionConGoogle(): Promise<UserCredential> {
  const credencial = await signInWithPopup(auth, googleProvider)
  
  // Si es la primera vez que entra, crear categorías predefinidas
  const esUsuarioNuevo = credencial.user.metadata.creationTime === credencial.user.metadata.lastSignInTime
  if (esUsuarioNuevo) {
    await crearCategoriasPredefinidas(credencial.user.uid)
  }
  
  return credencial
}

/**
 * Cierra la sesión del usuario actual.
 */
export async function cerrarSesion(): Promise<void> {
  await signOut(auth)
}

/**
 * Traduce los códigos de error de Firebase a mensajes en español.
 */
export function traducirErrorAuth(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return 'Ocurrió un error inesperado. Intenta de nuevo.'
  }
  
  const codigo = (error as { code: string }).code
  
  const mensajes: Record<string, string> = {
    'auth/email-already-in-use': 'Este email ya está registrado',
    'auth/invalid-email': 'El email no es válido',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
    'auth/user-not-found': 'No existe una cuenta con este email',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/invalid-credential': 'Email o contraseña incorrectos',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
    'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
    'auth/popup-closed-by-user': 'Cancelaste el inicio de sesión',
    'auth/popup-blocked': 'El navegador bloqueó el popup. Permítelo e intenta de nuevo.',
  }
  
  return mensajes[codigo] ?? 'Error: ' + codigo
}