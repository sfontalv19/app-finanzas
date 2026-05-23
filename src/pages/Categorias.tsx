import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import Modal from '../components/ui/Modal'
import CategoriaForm from '../components/forms/CategoriaForm'
import {
  useCategorias,
  useCrearCategoria,
  useActualizarCategoria,
  useEliminarCategoria,
} from '../hooks/useCategorias'
import { obtenerIcono } from '../utils/iconos'
import type { Categoria } from '../types'
import type { CategoriaFormData } from '../lib/schemas'

export default function Categorias() {
  const navigate = useNavigate()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null)
  const [tipoNuevaCategoria, setTipoNuevaCategoria] = useState<'ingreso' | 'egreso'>('egreso')
  
  // Hooks de React Query
  const { data: categorias, isLoading } = useCategorias()
  const crearMutation = useCrearCategoria()
  const actualizarMutation = useActualizarCategoria()
  const eliminarMutation = useEliminarCategoria()
  
  const categoriasIngreso = categorias?.filter((c) => c.tipo === 'ingreso') ?? []
  const categoriasEgreso = categorias?.filter((c) => c.tipo === 'egreso') ?? []
  
  const handleAbrirNueva = (tipo: 'ingreso' | 'egreso') => {
    setCategoriaEditando(null)
    setTipoNuevaCategoria(tipo)
    setModalAbierto(true)
  }
  
  const handleAbrirEdicion = (categoria: Categoria) => {
    setCategoriaEditando(categoria)
    setModalAbierto(true)
  }
  
  const handleSubmit = async (datos: CategoriaFormData) => {
    try {
      if (categoriaEditando) {
        await actualizarMutation.mutateAsync({ id: categoriaEditando.id, datos })
      } else {
        await crearMutation.mutateAsync(datos)
      }
      setModalAbierto(false)
      setCategoriaEditando(null)
    } catch (err) {
      console.error('Error al guardar categoría:', err)
      alert('Hubo un problema al guardar. Intenta de nuevo.')
    }
  }
  
  const handleEliminar = async (categoria: Categoria) => {
    if (categoria.esPredefinida) {
      alert('Las categorías predefinidas no se pueden eliminar')
      return
    }
    if (!confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) return
    
    try {
      await eliminarMutation.mutateAsync(categoria.id)
    } catch (err) {
      console.error('Error al eliminar:', err)
      alert('No se pudo eliminar. Intenta de nuevo.')
    }
  }
  
  // Estado de carga
  if (isLoading) {
    return (
      <div className="px-4 pt-6 pb-4">
        <header className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Categorías</h1>
        </header>
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
        <header className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Categorías
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">
              {categorias?.length ?? 0} categorías
            </p>
          </div>
        </header>
        
        {/* Egresos */}
        <section>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h2 className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
              Egresos ({categoriasEgreso.length})
            </h2>
            <button
              onClick={() => handleAbrirNueva('egreso')}
              className="flex items-center gap-1 text-xs text-purple-500 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Agregar
            </button>
          </div>
          <div className="space-y-2">
            {categoriasEgreso.map((cat) => (
              <CategoriaListItem
                key={cat.id}
                categoria={cat}
                onEditar={() => handleAbrirEdicion(cat)}
                onEliminar={() => handleEliminar(cat)}
              />
            ))}
          </div>
        </section>
        
        {/* Ingresos */}
        <section>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h2 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Ingresos ({categoriasIngreso.length})
            </h2>
            <button
              onClick={() => handleAbrirNueva('ingreso')}
              className="flex items-center gap-1 text-xs text-purple-500 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Agregar
            </button>
          </div>
          <div className="space-y-2">
            {categoriasIngreso.map((cat) => (
              <CategoriaListItem
                key={cat.id}
                categoria={cat}
                onEditar={() => handleAbrirEdicion(cat)}
                onEliminar={() => handleEliminar(cat)}
              />
            ))}
          </div>
        </section>
      </div>
      
      {/* Modal de crear/editar */}
      <Modal
        isOpen={modalAbierto}
        onClose={() => {
          setModalAbierto(false)
          setCategoriaEditando(null)
        }}
        title={categoriaEditando ? 'Editar categoría' : 'Nueva categoría'}
      >
        <CategoriaForm
          categoria={categoriaEditando ?? undefined}
          tipoInicial={tipoNuevaCategoria}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalAbierto(false)
            setCategoriaEditando(null)
          }}
        />
      </Modal>
    </>
  )
}

function CategoriaListItem({
  categoria,
  onEditar,
  onEliminar,
}: {
  categoria: Categoria
  onEditar: () => void
  onEliminar: () => void
}) {
  const Icon = obtenerIcono(categoria.icono)
  
  return (
    <div className="bg-white rounded-2xl p-3 border border-gray-100 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${categoria.color}20` }}
      >
        <Icon className="w-5 h-5" style={{ color: categoria.color }} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm truncate">
          {categoria.nombre}
        </p>
        {categoria.esPredefinida && (
          <p className="text-[10px] text-gray-400 mt-0.5">Predefinida</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onEditar}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
        {!categoria.esPredefinida && (
          <button
            onClick={onEliminar}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}