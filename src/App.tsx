import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
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

function App() {
  return (
    <Routes>
      {/* Rutas públicas (sin layout) */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      
      {/* Rutas con layout principal (con bottom tab bar) */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/cuentas" element={<Cuentas />} />
        <Route path="/cuentas/:id" element={<DetalleCuenta />} />
        <Route path="/agregar" element={<AgregarMovimiento />} />
        <Route path="/movimientos" element={<Movimientos />} />
        <Route path="/mas" element={<Mas />} />
        <Route path="/categorias" element={<Categorias />} />
        <Route path="/compras-cuotas" element={<ComprasCuotas />} />
      </Route>
    </Routes>
  )
}

export default App
