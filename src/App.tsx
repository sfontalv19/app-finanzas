import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import RutaProtegida from './components/RutaProtegida'
import RutaPublica from './components/RutaPublica'
import Login from './pages/Login'
import Registro from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Cuentas from './pages/Cuentas'
import AgregarMovimiento from './pages/AgregarMovimiento'
import DetalleCuenta from './pages/DetalleDeCuenta'
import Movimientos from './pages/Movimientos'
import Mas from './pages/Mas'
import Categorias from './pages/Categorias'
import ComprasCuotas from './pages/ComprasCuotas'
import HistorialMensual from './pages/HistorialMensual'

function App() {
  return (
    <Routes>
      {/* Redirección inicial */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Rutas públicas: solo accesibles si NO hay sesión */}
      <Route element={<RutaPublica />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
      </Route>
      
      {/* Rutas protegidas: solo accesibles CON sesión */}
      <Route element={<RutaProtegida />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cuentas" element={<Cuentas />} />
          <Route path="/cuentas/:id" element={<DetalleCuenta />} />
          <Route path="/agregar" element={<AgregarMovimiento />} />
          <Route path="/agregar/:id" element={<AgregarMovimiento />} />
          <Route path="/movimientos" element={<Movimientos />} />
          <Route path="/mas" element={<Mas/>} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/compras-cuotas" element={<ComprasCuotas />} />
          <Route path="/historial" element={<HistorialMensual />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App