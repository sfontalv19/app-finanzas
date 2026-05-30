import { z } from 'zod'

// Schema para crear/editar cuenta
export const cuentaSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(30, 'Máximo 30 caracteres'),
  
  tipo: z.enum(['debito', 'credito']),
  
  saldoInicial: z
    .number({ message: 'Ingresa un monto válido' })
    .min(0, 'El saldo no puede ser negativo'),
  
  cupoTotal: z
    .number({ message: 'Ingresa un monto válido' })
    .min(0, 'El cupo no puede ser negativo')
    .optional(),
  
  color: z.string().min(1, 'Elige un color'),
  
  icono: z.string().min(1, 'Elige un ícono'),
}).refine(
  (data) => {
    // Si es crédito, el cupo es obligatorio
    if (data.tipo === 'credito') {
      return data.cupoTotal !== undefined && data.cupoTotal > 0
    }
    return true
  },
  {
    message: 'El cupo es requerido para tarjetas de crédito',
    path: ['cupoTotal'],
  }
)

// Tipo TypeScript inferido del schema (¡automático!)
export type CuentaFormData = z.infer<typeof cuentaSchema>


// Schema para crear/editar movimiento
export const movimientoSchema = z.object({
  tipo: z.enum(['ingreso', 'egreso', 'transferencia']),
  
  monto: z
    .number({ message: 'Ingresa un monto válido' })
    .positive('El monto debe ser mayor a 0'),
  
  cuentaId: z.string().min(1, 'Selecciona una cuenta'),
  
  cuentaDestinoId: z.string().optional(),
  
  categoriaId: z.string().optional(),
  
  descripcion: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(80, 'Máximo 80 caracteres'),
  
  fecha: z.date(),
  
  // Campos para compra a cuotas
  esCompraCuotas: z.boolean().optional(),
  numeroCuotas: z.number().int().min(1).max(48).optional(),
  valorCuota: z.number().optional(),
  tieneIntereses: z.boolean().optional(),
}).refine(
  (data) => {
    // Si es transferencia, cuenta destino es obligatoria y debe ser distinta a origen
    if (data.tipo === 'transferencia') {
      return !!data.cuentaDestinoId && data.cuentaDestinoId !== data.cuentaId
    }
    return true
  },
  {
    message: 'Selecciona una cuenta destino diferente',
    path: ['cuentaDestinoId'],
  }
).refine(
  (data) => {
    // Si es ingreso o egreso (no transferencia), categoría es obligatoria
    if (data.tipo === 'ingreso' || data.tipo === 'egreso') {
      return !!data.categoriaId
    }
    return true
  },
  {
    message: 'Selecciona una categoría',
    path: ['categoriaId'],
  }
).refine(
  (data) => {
    // Si es compra a cuotas, validar campos
    if (data.esCompraCuotas) {
      if (!data.numeroCuotas || data.numeroCuotas < 1) return false
      if (data.tieneIntereses && (!data.valorCuota || data.valorCuota <= 0)) return false
    }
    return true
  },
  {
    message: 'Completa los datos de las cuotas',
    path: ['numeroCuotas'],
  }
)

export type MovimientoFormData = z.infer<typeof movimientoSchema>


// Schema para crear/editar categoría
export const categoriaSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(20, 'Máximo 20 caracteres'),
  
  tipo: z.enum(['ingreso', 'egreso']),
  
  color: z.string().min(1, 'Elige un color'),
  
  icono: z.string().min(1, 'Elige un ícono'),
})

export type CategoriaFormData = z.infer<typeof categoriaSchema>