import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../lib/firebase'

// definimos que informacion va a estar disponible en el contexto
interface AuthContextType{
    usuario: User | null
    cargando: boolean
}

// creamo el contexto con un valor inicial (todavia no sabemos nada)
const AuthContext = createContext<AuthContextType>({
    usuario: null,
    cargando: true
})

// Componente "envoltorio" que provee el contexto a toda la app
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [cargando, setCargando] = useState(true)
  
  useEffect(() => {
    // Firebase nos avisa cada vez que cambia la sesión
    const unsubscribe = onAuthStateChanged(auth, (usuarioFirebase) => {
      setUsuario(usuarioFirebase)
      setCargando(false)
    })
    
    // Limpieza: cuando el componente se desmonta, dejamos de escuchar
    return () => unsubscribe()
  }, [])
  
  return (
    <AuthContext.Provider value={{ usuario, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado para usar el contexto fácilmente
export function useAuth() {
  return useContext(AuthContext)
}

