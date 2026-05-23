import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import {
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from '../services/categoriasService'
import type { CategoriaFormData } from '../lib/schemas'

/**
 * Hook para obtener las categorías del usuario logueado.
 */
export function useCategorias() {
  const { usuario } = useAuth()
  const userId = usuario?.uid
  
  return useQuery({
    queryKey: ['categorias', userId],
    queryFn: () => obtenerCategorias(userId!),
    enabled: !!userId,
  })
}

/**
 * Hook para crear una nueva categoría.
 */
export function useCrearCategoria() {
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const userId = usuario?.uid
  
  return useMutation({
    mutationFn: (datos: CategoriaFormData) => crearCategoria(userId!, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias', userId] })
    },
  })
}

/**
 * Hook para actualizar una categoría.
 */
export function useActualizarCategoria() {
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const userId = usuario?.uid
  
  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: CategoriaFormData }) =>
      actualizarCategoria(userId!, id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias', userId] })
    },
  })
}

/**
 * Hook para eliminar una categoría.
 */
export function useEliminarCategoria() {
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const userId = usuario?.uid
  
  return useMutation({
    mutationFn: (categoriaId: string) => eliminarCategoria(userId!, categoriaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias', userId] })
    },
  })
}