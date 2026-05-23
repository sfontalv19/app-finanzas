import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


// la configuracion de las variables de entorno para poder llamarlas
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

//iniciar firebase ( esto enciende la conexion)
export const app = initializeApp(firebaseConfig)


// exportar los servicios que vamos a usar en otras partes de la app
export const auth = getAuth(app) // para login
export const db = getFirestore(app) // para guardar y leer

// Provider de Google para el botón "Continuar con Google"
export const googleProvider = new GoogleAuthProvider()