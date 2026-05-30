import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import {
  obtenerComprasCuotas,
  crearCompraCuotas,
  pagarCuota,
  actualizarCompraCuotas,
  eliminarCompraCuotas,
} from '../services/comprasCuotasService'
import type { CompraCuotas } from '../types'
import type { MovimientoFormData } from '../lib/schemas'

/**
 * Hook para obtener todas las compras a cuotas.
 */
export function useComprasCuotas() {
  const { usuario } = useAuth()
  const userId = usuario?.uid
  
  return useQuery({
    queryKey: ['comprasCuotas', userId],
    queryFn: () => obtenerComprasCuotas(userId!),
    enabled: !!userId,
  })
}

/**
 * Hook para crear una compra a cuotas.
 * Invalida también movimientos y cuentas porque ambos cambian.
 */
export function useCrearCompraCuotas() {
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const userId = usuario?.uid
  
  return useMutation({
    mutationFn: (datos: MovimientoFormData) => crearCompraCuotas(userId!, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comprasCuotas', userId] })
      queryClient.invalidateQueries({ queryKey: ['movimientos', userId] })
      queryClient.invalidateQueries({ queryKey: ['cuentas', userId] })
    },
  })
}

/**
 * Hook para pagar una cuota.
 */
export function usePagarCuota() {
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const userId = usuario?.uid
  
  return useMutation({
    mutationFn: ({ compraCuotas, cuentaPagoId }: { compraCuotas: CompraCuotas; cuentaPagoId: string }) =>
      pagarCuota(userId!, compraCuotas, cuentaPagoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comprasCuotas', userId] })
      queryClient.invalidateQueries({ queryKey: ['movimientos', userId] })
      queryClient.invalidateQueries({ queryKey: ['cuentas', userId] })
    },
  })
}

/**
 * Hook para actualizar una compra a cuotas.
 */
export function useActualizarCompraCuotas() {
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const userId = usuario?.uid
  
  return useMutation({
    mutationFn: ({
      compraOriginal,
      datosNuevos,
    }: {
      compraOriginal: CompraCuotas
      datosNuevos: {
        montoTotal: number
        numeroCuotas: number
        valorCuota?: number
        tieneIntereses: boolean
        categoriaId: string
        descripcion: string
      }
    }) => actualizarCompraCuotas(userId!, compraOriginal, datosNuevos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comprasCuotas', userId] })
      queryClient.invalidateQueries({ queryKey: ['movimientos', userId] })
      queryClient.invalidateQueries({ queryKey: ['cuentas', userId] })
    },
  })
}

/**
 * Hook para eliminar una compra a cuotas.
 * Devuelve al cupo lo que faltaba por pagar y borra el movimiento original.
 */
export function useEliminarCompraCuotas() {
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const userId = usuario?.uid
  
  return useMutation({
    mutationFn: (compra: CompraCuotas) => eliminarCompraCuotas(userId!, compra),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comprasCuotas', userId] })
      queryClient.invalidateQueries({ queryKey: ['movimientos', userId] })
      queryClient.invalidateQueries({ queryKey: ['cuentas', userId] })
    },
  })
}
