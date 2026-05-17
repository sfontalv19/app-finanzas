import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { DatosGrafico } from '../utils/graficos'
import { formatearDinero } from '../utils/formatters'

interface GraficoGastosProps {
  datos: DatosGrafico[]
  totalGastos: number
}

export default function GraficoGastos({ datos, totalGastos }: GraficoGastosProps) {
  // Si no hay datos, mostrar estado vacío
  if (datos.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
        <p className="text-sm text-gray-500">
          No hay gastos este mes 🌸
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Cuando registres egresos, verás el desglose acá
        </p>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      
      {/* Gráfico tipo dona con total en el centro */}
      <div className="relative h-48 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={datos}
              dataKey="total"
              nameKey="nombre"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={2}
              startAngle={90}
              endAngle={450}
            >
              {datos.map((entry) => (
                <Cell
                  key={entry.categoriaId}
                  fill={entry.color}
                  stroke="none"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Total en el centro */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
            Total
          </p>
          <p className="text-xl font-bold text-gray-800 mt-0.5">
            {formatearDinero(totalGastos)}
          </p>
        </div>
      </div>
      
      {/* Leyenda con detalle */}
      <div className="space-y-2.5 mt-4">
        {datos.map((dato) => (
          <div key={dato.categoriaId} className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: dato.color }}
            />
            <p className="text-sm font-medium text-gray-700 flex-1 truncate">
              {dato.nombre}
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {formatearDinero(dato.total)}
            </p>
            <p className="text-xs text-gray-400 w-10 text-right">
              {dato.porcentaje.toFixed(0)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}