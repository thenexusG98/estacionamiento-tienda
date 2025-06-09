// src/components/Reportes.tsx
import { useState } from 'react';

type CorteDiario = {
  fecha: string;
  totalTienda: number;
  totalEstacionamiento: number;
  totalBanos: number;
};

const reportesEjemplo: CorteDiario[] = [
  {
    fecha: '2025-06-08',
    totalTienda: 8459,
    totalEstacionamiento: 1420,
    totalBanos: 260,
  },
  {
    fecha: '2025-06-07',
    totalTienda: 7520,
    totalEstacionamiento: 1280,
    totalBanos: 220,
  },
];

export default function Reportes() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const reporte = reportesEjemplo.find((r) => r.fecha === fechaSeleccionada);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Reportes Diarios</h2>

      {/* Selector de fecha */}
      <div className="mb-6">
        <label className="block mb-2 font-medium text-gray-700">Selecciona una fecha:</label>
        <select
          value={fechaSeleccionada}
          onChange={(e) => setFechaSeleccionada(e.target.value)}
          className="border px-4 py-2 rounded w-full md:w-1/3"
        >
          <option value="">-- Elegir fecha --</option>
          {reportesEjemplo.map((r) => (
            <option key={r.fecha} value={r.fecha}>
              {r.fecha}
            </option>
          ))}
        </select>
      </div>

      {reporte ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ReporteCard titulo="Tienda" monto={reporte.totalTienda} color="bg-blue-100" />
          <ReporteCard titulo="Estacionamiento" monto={reporte.totalEstacionamiento} color="bg-green-100" />
          <ReporteCard titulo="Baños" monto={reporte.totalBanos} color="bg-yellow-100" />
        </div>
      ) : (
        <p className="text-gray-500">Selecciona una fecha para ver el reporte.</p>
      )}
    </div>
  );
}

function ReporteCard({ titulo, monto, color }: { titulo: string; monto: number; color: string }) {
  return (
    <div className={`p-6 rounded-xl shadow ${color}`}>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{titulo}</h3>
      <p className="text-2xl font-bold text-gray-800">${monto.toLocaleString()}</p>
    </div>
  );
}
