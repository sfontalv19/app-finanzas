import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Wallet, Eye, EyeOff, Mail, Lock } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  
  // Estado de los campos del formulario
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  
  // Cuando el usuario envía el formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Por ahora solo navegamos al dashboard
    // Cuando conectemos Firebase acá validaremos credenciales
    console.log('Login intento:', { email, password })
    navigate('/dashboard')
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        
        {/* Logo y título */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl mb-4 shadow-lg shadow-purple-200">
            <Wallet className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">
            Vato App
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Para que mi amorcito maneje sus finanzas 💜
          </p>
        </div>
        
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Campo Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition"
              />
            </div>
          </div>
          
          {/* Campo Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-11 pr-11 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {mostrarPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          
          {/* Link olvidé contraseña */}
          <div className="text-right">
            <button
              type="button"
              className="text-sm text-purple-500 hover:text-purple-600 font-medium"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          
          {/* Botón principal */}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold rounded-xl shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 active:scale-[0.98] transition-all"
          >
            Iniciar sesión
          </button>
        </form>
        
        {/* Separador */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-4 text-xs text-gray-400 uppercase tracking-wider">
            o continúa con
          </span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>
        
        {/* Botón Google (por ahora solo visual) */}
        <button
          type="button"
          className="w-full py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>
        
        {/* Link a registro */}
        <p className="text-center text-sm text-gray-600 mt-8">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-purple-500 hover:text-purple-600 font-semibold">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}