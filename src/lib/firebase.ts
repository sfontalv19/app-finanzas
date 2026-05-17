import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Las credenciales vienen del archivo .env.local en la raíz del proyecto.
// Si no existe ese archivo o las variables, la app fallará al iniciar.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Validar que todas las variables están definidas
const camposRequeridos = Object.entries(firebaseConfig).filter(([_, valor]) => !valor)
if (camposRequeridos.length > 0) {
  const faltantes = camposRequeridos.map(([clave]) => `VITE_FIREBASE_${clave.replace(/([A-Z])/g, '_$1').toUpperCase()}`)
  throw new Error(
    `Faltan variables de Firebase en .env.local: ${faltantes.join(', ')}\n` +
    'Crea el archivo .env.local en la raíz del proyecto con tus credenciales.'
  )
}

// Inicializar Firebase
export const app = initializeApp(firebaseConfig)

// Exportar servicios que usaremos
export const auth = getAuth(app)
export const db = getFirestore(app)

// Provider de Google para login
export const googleProvider = new GoogleAuthProvider()
