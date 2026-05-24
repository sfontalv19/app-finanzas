// Tipos para las cuentas
export type TipoCuenta = 'debito' | 'credito'

export interface Cuenta {
  id: string
  nombre: string
  tipo: TipoCuenta
  saldoInicial: number
  saldoActual: number
  cupoTotal?: number          // solo para tarjetas de crédito
  cupoDisponible?: number     // solo para tarjetas de crédito
  color: string
  icono: string
  creadaEn: Date
  archivada: boolean
}

// Tipos para categorías
export type TipoCategoria = 'ingreso' | 'egreso'

export interface Categoria {
  id: string
  nombre: string
  tipo: TipoCategoria
  icono: string
  color: string
  esPredefinida: boolean
}

// Tipos para movimientos
export type TipoMovimiento = 'ingreso' | 'egreso' | 'transferencia'

export interface Movimiento {
  id: string
  tipo: TipoMovimiento
  monto: number
  cuentaId: string
  cuentaDestinoId?: string    // solo para transferencias
  categoriaId?: string        // null si es transferencia
  descripcion: string
  fecha: Date
  creadoEn: Date
  compraCuotasId?: string   // si es una cuota de una compra
  esCompraCuotas?: boolean  // 👈 Agregar
  numeroCuotas?: number      // 👈 Agregar
  valorCuota?: number        // 👈 Agregar
  tieneIntereses?: boolean       
}

// Tipos para compras a cuotas
export interface CompraCuotas {
  id: string
  cuentaId: string            // siempre una tarjeta de crédito
  montoTotal: number
  numeroCuotas: number
  valorCuota: number
  tieneIntereses: boolean
  categoriaId: string
  descripcion: string
  fechaCompra: Date
  primerMesPago: Date
  cuotasPagadas: number
  cuotasRestantes: number
  activa: boolean
}