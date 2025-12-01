import { useEffect, useState } from "react";
import { obtenerTicketsDelDia, obtenerVentasPorDia, verificarModuloBloqueado } from "../lib/db";
import ExportCSV from "../lib/Functions";
import { useAuth } from "../contexts/AuthContext";

// Función helper para obtener fecha local
function obtenerFechaLocal(): string {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

export default function VentasRegistradas() {
  const { user } = useAuth();
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() =>
    obtenerFechaLocal()
  );

  const [modulosBloqueados, setModulosBloqueados] = useState<Record<string, boolean>>({});

  const [datos, setDatos] = useState<{
    tickets: number;
    baños: number;
    ventas_totales: number;
    venta_paqueteria: number;
  }>({ tickets: 0, baños: 0, ventas_totales: 0, venta_paqueteria: 0 });

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
    paqueteria: {
      id: number;
      fecha_recoleccion: string ;
      monto: number;
    }[];
  }>({ baños: [], estacionamiento: [], tienda: [], paqueteria: [] });

  useEffect(() => {
    const cargarVentas = async () => {
      const resumen = await obtenerTicketsDelDia(fechaSeleccionada);
      setDatos(resumen);

      const ventas = await obtenerVentasPorDia(fechaSeleccionada);
      setVentasDia(ventas);

      // Cargar módulos bloqueados si no es admin
      if (user?.role !== 'admin') {
        try {
          const modulos = ['estacionamiento', 'baños', 'ventas', 'paqueteria'];
          const estados: Record<string, boolean> = {};
          
          for (const modulo of modulos) {
            const bloqueado = await verificarModuloBloqueado(modulo);
            estados[modulo] = bloqueado;
          }
          
          setModulosBloqueados(estados);
        } catch (e) {
          console.error('Error al verificar módulos bloqueados:', e);
        }
      }
    };

    cargarVentas();
  }, [fechaSeleccionada, user]);

  const ventaTotal = datos.tickets + datos.baños + datos.ventas_totales + datos.venta_paqueteria;

  // Filtrar categorías según módulos bloqueados
  const datosTransformados = [
    ...(user?.role === 'admin' || !modulosBloqueados['estacionamiento'] ? [{
      fecha: fechaSeleccionada,
      categoria: "estacionamiento",
      total: datos.tickets,
    }] : []),
    ...(user?.role === 'admin' || !modulosBloqueados['baños'] ? [{
      fecha: fechaSeleccionada,
      categoria: "baños",
      total: datos.baños,
    }] : []),
    ...(user?.role === 'admin' || !modulosBloqueados['ventas'] ? [{
      fecha: fechaSeleccionada,
      categoria: "tienda",
      total: datos.ventas_totales,
    }] : []),
    ...(user?.role === 'admin' || !modulosBloqueados['paqueteria'] ? [{
      fecha: fechaSeleccionada,
      categoria: "paqueteria",
      total: datos.venta_paqueteria,
    }] : []),
  ];

  const data = [
    ...(user?.role === 'admin' || !modulosBloqueados['estacionamiento'] 
      ? ventasDia.estacionamiento.map((item) => ({
          fecha: item.fecha_salida,
          categoria: "estacionamiento",
          descripcion: item.placas,
          total: item.total,
        }))
      : []
    ),
    ...(user?.role === 'admin' || !modulosBloqueados['baños']
      ? ventasDia.baños.map((item) => ({
          fecha: item.fecha_hora,
          categoria: "baños",
          descripcion: `Baño #${item.id}`,
          total: item.monto,
        }))
      : []
    ),
    ...(user?.role === 'admin' || !modulosBloqueados['ventas']
      ? ventasDia.tienda.map((item) => ({
          fecha: item.fecha,
          categoria: "tienda",
          descripcion: `${item.producto} x${item.cantidad}`,
          total: item.total,
        }))
      : []
    ),
    ...(user?.role === 'admin' || !modulosBloqueados['paqueteria']
      ? ventasDia.paqueteria.map((item) => ({
          fecha: item.fecha_recoleccion,
          categoria: "paqueteria",
          descripcion: `Paquete #${item.id}`,
          total: item.monto,
        }))
      : []
    ),
  ];

  return (
    <>
      <div className="w-5/6 mx-auto mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <label className="block text-gray-700 mb-1 font-semibold">
              Seleccionar fecha
            </label>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded w-full md:w-auto"
            />
          </div>
          <div className="text-right">
            {user?.role === 'admin' ? (
              <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg">
                <span className="font-semibold">📊 Vista Administrador</span>
                <p className="text-xs mt-1">Mostrando ventas de todos los usuarios</p>
              </div>
            ) : (
              <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg">
                <span className="font-semibold">👤 Mis Ventas</span>
                <p className="text-xs mt-1">Mostrando solo tus registros</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {ventaTotal === 0 ? (
        <div className="bg-white shadow rounded-lg p-4 mb-4 w-5/6 items-center mx-auto">
          <h3 className="text-lg font-semibold text-gray-800">
            No hay ventas registradas para esta fecha.
          </h3>
        </div>
      ) : (
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
              <ExportCSV
                data={data}
                fileName={`ventas ${fechaSeleccionada}.csv`}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
