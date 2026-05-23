import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import {
  obtenerCuentas,
  obtenerCuenta,
  crearCuenta,
  actualizarCuenta,
  archivarCuenta,
} from '../services/cuentasService'
import type { CuentaFormData } from '../lib/schemas'

/**
 * Hook para obtener todas las cuentas del usuario.
 */
export function useCuentas() {
  const { usuario } = useAuth()
  const userId = usuario?.uid
  
  return useQuery({
    queryKey: ['cuentas', userId],
    queryFn: () => obtenerCuentas(userId!),
    enabled: !!userId,
  })
}

/**
 * Hook para obtener una cuenta específica por ID.
 */
export function useCuenta(cuentaId: string | undefined) {
  const { usuario } = useAuth()
  const userId = usuario?.uid
  
  return useQuery({
    queryKey: ['cuentas', userId, cuentaId],
    queryFn: () => obtenerCuenta(userId!, cuentaId!),
    enabled: !!userId && !!cuentaId,
  })
}

/**
 * Hook para crear una cuenta.
 */
export function useCrearCuenta() {
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const userId = usuario?.uid
  
  return useMutation({
    mutationFn: (datos: CuentaFormData) => crearCuenta(userId!, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuentas', userId] })
    },
  })
}

/**
 * Hook para actualizar una cuenta.
 */
export function useActualizarCuenta() {
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const userId = usuario?.uid
  
  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: CuentaFormData }) =>
      actualizarCuenta(userId!, id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuentas', userId] })
    },
  })
}

/**
 * Hook para archivar una cuenta.
 */
export function useArchivarCuenta() {
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const userId = usuario?.uid
  
  return useMutation({
    mutationFn: (cuentaId: string) => archivarCuenta(userId!, cuentaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuentas', userId] })
    },
  })
}