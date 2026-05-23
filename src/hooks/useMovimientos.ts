import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import {
  obtenerMovimientos,
  crearMovimiento,
  eliminarMovimiento,
} from '../services/movimientosService'
import type { Movimiento } from '../types'
import type { MovimientoFormData } from '../lib/schemas'

/**
 * Hook para obtener todos los movimientos del usuario.
 */
export function useMovimientos() {
  const { usuario } = useAuth()
  const userId = usuario?.uid
  
  return useQuery({
    queryKey: ['movimientos', userId],
    queryFn: () => obtenerMovimientos(userId!),
    enabled: !!userId,
  })
}

/**
 * Hook para crear un movimiento.
 * Después de crearlo, invalida tanto movimientos como cuentas
 * (porque los saldos cambiaron).
 */
export function useCrearMovimiento() {
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const userId = usuario?.uid
  
  return useMutation({
    mutationFn: (datos: MovimientoFormData) => crearMovimiento(userId!, datos),
    onSuccess: () => {
      // Invalidar movimientos para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ['movimientos', userId] })
      // Invalidar cuentas porque los saldos cambiaron
      queryClient.invalidateQueries({ queryKey: ['cuentas', userId] })
    },
  })
}

/**
 * Hook para eliminar un movimiento.
 */
export function useEliminarMovimiento() {
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const userId = usuario?.uid
  
  return useMutation({
    mutationFn: (movimiento: Movimiento) => eliminarMovimiento(userId!, movimiento),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos', userId] })
      queryClient.invalidateQueries({ queryKey: ['cuentas', userId] })
    },
  })
}