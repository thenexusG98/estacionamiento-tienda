import { useEffect, useState } from "react";
import { obtenerTicketsDelDia, obtenerVentasPorDia } from "../lib/db";
import ExportCSV from "../lib/Functions";

export default function VentasRegistradas() {
  const [datos, setDatos] = useState<{
    tickets: number;
    baños: number;
    ventas_totales: number;
  }>({ tickets: 0, baños: 0, ventas_totales: 0 });

  const [ventasDia, setVentasDia] = useState<{
    baños: { id: number; fecha_hora: string; monto: number }[];
    estacionamiento: {
      id: number;
      fecha_salida: string;
      placas: string;
      total: number;
    }[];
    tienda: {
      id: number;
      fecha: string;
      producto: string;
      cantidad: number;
      total: number;
    }[];
  }>({ baños: [], estacionamiento: [], tienda: [] });

  useEffect(() => {
    const cargarVentas = async () => {
      const resumen = await obtenerTicketsDelDia();
      setDatos(resumen);

      const ventas = await obtenerVentasPorDia(
        new Date().toISOString().slice(0, 10)
      );
      setVentasDia(ventas);
      console.log("Ventas del día:", ventas);
      
    };

    cargarVentas();
  }, []);

  const fecha = new Date().toISOString().slice(0, 10);

  const ventaTotal = datos.tickets + datos.baños + datos.ventas_totales;
  if (ventaTotal === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-4 mb-4 w-5/6 items-center mx-auto">
        <h3 className="text-lg font-semibold text-gray-800">
          No hay ventas registradas para hoy.
        </h3>
      </div>
    );
  }

  const datosTransformados = [
    {
      fecha,
      categoria: "estacionamiento",
      total: datos.tickets,
    },
    {
      fecha,
      categoria: "baños",
      total: datos.baños,
    },
    {
      fecha,
      categoria: "tienda",
      total: datos.ventas_totales,
    },
  ];

  const data = [
    ...ventasDia.estacionamiento.map((item) => ({
      fecha: item.fecha_salida,
      categoria: "estacionamiento",
      descripcion: item.placas,
      total: item.total,
    })),
    ...ventasDia.baños.map((item) => ({
      fecha: item.fecha_hora,
      categoria: "banos",
      descripcion: `Bano #${item.id}`,
      total: item.monto,
    })),
    ...ventasDia.tienda.map((item) => ({
      fecha: item.fecha,
      categoria: "tienda",
      descripcion: `${item.producto} x${item.cantidad}`,
      total: item.total,
    })),
  ];

  console.log("Datos fecha:", data);
  

  return (
    <>
      {datosTransformados.map(
        (
          grupo: { fecha: string; categoria: string; total: number },
          i: number
        ) => (
          <div
            key={i}
            className="bg-white shadow rounded-lg p-4 mb-4 w-5/6 items-center mx-auto"
          >
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
        )
      )}
      <div className="bg-white shadow rounded-lg p-4 mb-4 w-5/6 items-center mx-auto">
        <h3 className="text-lg font-semibold text-gray-800 text-center ">
          Total del día: ${ventaTotal.toFixed(2)}
        </h3>
        <div className="flex justify-center mt-2">
          <ExportCSV data={data} fileName={`ventas ${fecha}.csv`} />
        </div>
      </div>
    </>
  );
}
