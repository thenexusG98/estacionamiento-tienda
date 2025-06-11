// src/components/Reportes.tsx
import { useEffect, useState } from 'react';
import { getDb } from '../lib/db';

export default function Reportes() {
  const [fechasDisponibles, setFechasDisponibles] = useState<string[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [reporte, setReporte] = useState<{
    totalTienda: number;
    totalEstacionamiento: number;
    totalBanos: number;
  } | null>(null);

  useEffect(() => {
    const cargarFechas = async () => {
      const db = await getDb();
      const fechas = await db.select<{ fecha: string }[]>(
        `SELECT DISTINCT DATE(fecha_hora) as fecha FROM (
          SELECT fecha FROM ventas_totales
          UNION ALL
          SELECT fecha_hora FROM estacionamiento_tickets
          UNION ALL
          SELECT fecha_hora FROM baños
        ) WHERE fecha_hora IS NOT NULL ORDER BY fecha DESC`
      );
      setFechasDisponibles(fechas.map((f) => f.fecha));
    };

    cargarFechas();
  }, []);

  const cargarReporte = async (fecha: string) => {
    const db = await getDb();
    const [{ totalTienda = 0 } = {}] = await db.select<{ totalTienda: number }[]>(
      `SELECT SUM(total) as totalTienda FROM ventas_totales WHERE DATE(fecha_hora) = ?`,
      [fecha]
    );
    const [{ totalEstacionamiento = 0 } = {}] = await db.select<{ totalEstacionamiento: number }[]>(
      `SELECT COUNT(*) * 10 as totalEstacionamiento FROM estacionamiento_tickets WHERE DATE(fecha_hora) = ?`,
      [fecha]
    );
    const [{ totalBanos = 0 } = {}] = await db.select<{ totalBanos: number }[]>(
      `SELECT SUM(monto) as totalBanos FROM baños WHERE DATE(fecha_hora) = ?`,
      [fecha]
    );

    setReporte({ totalTienda, totalEstacionamiento, totalBanos });
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Reportes Diarios</h2>

      {/* Selector de fecha */}
      <div className="mb-6">
        <label className="block mb-2 font-medium text-gray-700">Selecciona una fecha:</label>
        <select
          value={fechaSeleccionada}
          onChange={(e) => {
            setFechaSeleccionada(e.target.value);
            cargarReporte(e.target.value);
          }}
          className="border px-4 py-2 rounded w-full md:w-1/3"
        >
          <option value="">-- Elegir fecha --</option>
          {fechasDisponibles.map((fecha) => (
            <option key={fecha} value={fecha}>
              {fecha}
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
