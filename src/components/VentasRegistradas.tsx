import { useEffect, useState } from 'react';
import { obtenerVentas } from '../lib/db';

type Venta = {
  id: number;
  producto: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  fecha: string;
};

export default function VentasRegistradas() {
  const [ventas, setVentas] = useState<Venta[]>([]);

  useEffect(() => {
    const cargarVentas = async () => {
      const data = await obtenerVentas();
      setVentas(data);
    };

    cargarVentas();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Historial de Ventas</h2>

      {ventas.length === 0 ? (
        <p className="text-gray-500">No hay ventas registradas aún.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded shadow">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border text-left">Fecha</th>
                <th className="py-2 px-4 border text-left">Producto</th>
                <th className="py-2 px-4 border text-left">Cantidad</th>
                <th className="py-2 px-4 border text-left">Precio</th>
                <th className="py-2 px-4 border text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((venta) => (
                <tr key={venta.id}>
                  <td className="py-2 px-4 border">{new Date(venta.fecha).toLocaleString()}</td>
                  <td className="py-2 px-4 border">{venta.producto}</td>
                  <td className="py-2 px-4 border">{venta.cantidad}</td>
                  <td className="py-2 px-4 border">${venta.precio_unitario}</td>
                  <td className="py-2 px-4 border font-semibold">${venta.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
