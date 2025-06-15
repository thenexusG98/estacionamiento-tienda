import { useEffect, useState } from 'react';
import { obtenerTicketsDelDia } from '../lib/db';


export default function VentasRegistradas() {
  const [datos, setDatos] = useState<{
    tickets: number;
    baños: number;
    ventas_totales: number;
  }>({ tickets: 0, baños: 0, ventas_totales: 0 });


  useEffect(() => {
  
    const cargarVentas = async () => {
    const resumen = await obtenerTicketsDelDia();
      setDatos(resumen);
      
    };

    cargarVentas();
  }, []);

  const fecha = new Date().toISOString().slice(0, 10);

  const ventaTotal = datos.tickets + datos.baños + datos.ventas_totales;
  if (ventaTotal === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-4 mb-4 w-5/6 items-center mx-auto">
        <h3 className="text-lg font-semibold text-gray-800">No hay ventas registradas para hoy.</h3>
      </div>
    );
  }

  const datosTransformados = [
    {
      fecha,
      categoria: 'estacionamiento',
      total: datos.tickets,
    },
    {
      fecha,
      categoria: 'baños',
      total: datos.baños,
    },
    {
      fecha,
      categoria: 'tienda',
      total: datos.ventas_totales,
    },
  ];

  return (
    <>
      {datosTransformados.map((grupo: { fecha: string; categoria: string; total: number }, i: number) => (
        <div key={i} className="bg-white shadow rounded-lg p-4 mb-4 w-5/6 items-center mx-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">
              {grupo.fecha} — {grupo.categoria.toUpperCase()}
            </h3>
            <span className="text-green-600 font-bold">
              ${grupo.total.toFixed(2)}
            </span>
          </div>
          <div className="text-sm text-gray-600">Total vendido</div>
        </div>
      ))}
      <div className="bg-white shadow rounded-lg p-4 mb-4 w-5/6 items-center mx-auto">
        <h3 className="text-lg font-semibold text-gray-800 text-center ">
          Total del día: ${ventaTotal.toFixed(2)}
        </h3>
        <div className="flex justify-center mt-2">
          <button>
            <span className="text-sm hover:underline bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Descargar ventas del día
            </span>
          </button>
        </div>
      </div>
    </>
  );


    /*<div className="p-6">
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
  );*/
}
