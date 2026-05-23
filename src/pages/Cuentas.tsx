import { useState } from 'react'
import { Plus, Wallet, CreditCard, Loader2 } from 'lucide-react'
import AccountListItem from '../components/AccountListItem'
import Modal from '../components/ui/Modal'
import CuentaForm from '../components/forms/CuentaForm'
import { useCuentas, useCrearCuenta } from '../hooks/useCuentas'
import { formatearDinero } from '../utils/formatters'
import type { CuentaFormData } from '../lib/schemas'

export default function Cuentas() {
  const [modalAbierto, setModalAbierto] = useState(false)
  
  const { data: cuentas, isLoading } = useCuentas()
  const crearMutation = useCrearCuenta()
  
  const cuentasActivas = cuentas?.filter((c) => !c.archivada) ?? []
  const cuentasDebito = cuentasActivas.filter((c) => c.tipo === 'debito')
  const cuentasCredito = cuentasActivas.filter((c) => c.tipo === 'credito')
  
  const totalDisponible = cuentasDebito.reduce(
    (total, cuenta) => total + cuenta.saldoActual,
    0
  )
  
  const totalDeuda = cuentasCredito.reduce((total, cuenta) => {
    const deuda = (cuenta.cupoTotal ?? 0) - (cuenta.cupoDisponible ?? 0)
    return total + deuda
  }, 0)
  
  const handleCrearCuenta = async (datos: CuentaFormData) => {
    try {
      await crearMutation.mutateAsync(datos)
      setModalAbierto(false)
    } catch (err) {
      console.error('Error al crear cuenta:', err)
      alert('Hubo un problema al crear la cuenta. Intenta de nuevo.')
    }
  }
  
  // Estado de carga
  if (isLoading) {
    return (
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Mis cuentas</h1>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      </div>
    )
  }
  
  return (
    <>
      <div className="px-4 pt-6 pb-4 space-y-5">
        
        {/* Header */}
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Mis cuentas
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {cuentasActivas.length} {cuentasActivas.length === 1 ? 'cuenta' : 'cuentas'}
            </p>
          </div>
          
          <button
            onClick={() => setModalAbierto(true)}
            className="w-11 h-11 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center shadow-md shadow-purple-200 active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
        </header>
        
        {/* Resumen de totales */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
              <Wallet className="w-4 h-4" strokeWidth={2.5} />
              <p className="text-[11px] font-semibold uppercase tracking-wide">
                Disponible
              </p>
            </div>
            <p className="text-lg font-bold text-gray-800">
              {formatearDinero(totalDisponible)}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              en {cuentasDebito.length} {cuentasDebito.length === 1 ? 'cuenta' : 'cuentas'}
            </p>
          </div>
          
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-1.5 text-rose-500 mb-1">
              <CreditCard className="w-4 h-4" strokeWidth={2.5} />
              <p className="text-[11px] font-semibold uppercase tracking-wide">
                Deuda
              </p>
            </div>
            <p className="text-lg font-bold text-gray-800">
              {formatearDinero(totalDeuda)}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              en {cuentasCredito.length} {cuentasCredito.length === 1 ? 'tarjeta' : 'tarjetas'}
            </p>
          </div>
        </div>
        
        {/* Cuentas de débito */}
        {cuentasDebito.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5 px-1">
              Cuentas
            </h2>
            <div className="space-y-2">
              {cuentasDebito.map((cuenta) => (
                <AccountListItem key={cuenta.id} cuenta={cuenta} />
              ))}
            </div>
          </section>
        )}
        
        {/* Tarjetas de crédito */}
        {cuentasCredito.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5 px-1">
              Tarjetas de crédito
            </h2>
            <div className="space-y-2">
              {cuentasCredito.map((cuenta) => (
                <AccountListItem key={cuenta.id} cuenta={cuenta} />
              ))}
            </div>
          </section>
        )}
        
        {/* Estado vacío */}
        {cuentasActivas.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-50 rounded-full mb-4">
              <Wallet className="w-8 h-8 text-purple-400" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              No tienes cuentas aún
            </h3>
            <p className="text-sm text-gray-500 mt-1.5 mb-5">
              Agrega tu primera cuenta para empezar a registrar movimientos
            </p>
            <button
              onClick={() => setModalAbierto(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-400 to-pink-400 text-white text-sm font-semibold rounded-xl shadow-md shadow-purple-200 active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Agregar cuenta
            </button>
          </div>
        )}
      </div>
      
      {/* Modal de crear cuenta */}
      <Modal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title="Nueva cuenta"
      >
        <CuentaForm
          onSubmit={handleCrearCuenta}
          onCancel={() => setModalAbierto(false)}
        />
      </Modal>
    </>
  )
}