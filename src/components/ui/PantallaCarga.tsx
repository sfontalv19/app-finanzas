import { Loader2, Wallet } from 'lucide-react'

export default function PantallaCarga() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl mb-4 shadow-lg shadow-purple-200">
          <Wallet className="w-8 h-8 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex items-center justify-center gap-2 text-purple-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <p className="text-sm font-medium">Cargando...</p>
        </div>
      </div>
    </div>
  )
}