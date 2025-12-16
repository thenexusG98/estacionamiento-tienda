import { useEffect, useState } from "react";
import { obtenerTicketsDelDia, obtenerVentasPorDia, verificarModuloBloqueado } from "../lib/db";
import ExportCSV from "../lib/Functions";
import { useAuth } from "../contexts/AuthContext";
import { FaCalendarAlt, FaChartLine, FaCar, FaToilet, FaShoppingCart, FaBox, FaDollarSign, FaCheck } from 'react-icons/fa';

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
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

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
      setLoading(true);
      try {
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
      } finally {
        setLoading(false);
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

  // Función para manejar exportación con alerta
  const handleExportarCSV = () => {
    const totalRegistros = data.length;
    const fechaFormateada = new Date(fechaSeleccionada).toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
    
    alert(`✅ ¡ARCHIVO CSV EXPORTADO EXITOSAMENTE!\n\n📊 Detalles:\n• Fecha: ${fechaFormateada}\n• Total de registros: ${totalRegistros}\n• Monto total: $${ventaTotal.toFixed(2)}\n• Archivo: ventas_${fechaSeleccionada}.csv\n\n¡Archivo descargado correctamente!`);
    
    setSuccessMessage('✅ Archivo CSV exportado correctamente');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Función helper para obtener el icono según categoría
  const obtenerIconoCategoria = (categoria: string) => {
    switch(categoria.toLowerCase()) {
      case 'estacionamiento': return <FaCar className="text-blue-600 text-xl" />;
      case 'baños': return <FaToilet className="text-purple-600 text-xl" />;
      case 'tienda': return <FaShoppingCart className="text-green-600 text-xl" />;
      case 'paqueteria': return <FaBox className="text-orange-600 text-xl" />;
      default: return <FaDollarSign className="text-gray-600 text-xl" />;
    }
  };

  // Función helper para obtener el color según categoría
  const obtenerColorCategoria = (categoria: string) => {
    switch(categoria.toLowerCase()) {
      case 'estacionamiento': return 'from-blue-600 to-blue-700';
      case 'baños': return 'from-purple-600 to-purple-700';
      case 'tienda': return 'from-green-600 to-green-700';
      case 'paqueteria': return 'from-orange-600 to-orange-700';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 lg:p-8">
      {/* Encabezado */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-600 p-3 rounded-lg">
            <FaChartLine className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">Ventas Registradas</h1>
            <p className="text-gray-600 text-sm mt-1">Visualiza y analiza las ventas del día seleccionado</p>
          </div>
        </div>
      </div>

      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-slideDown">
          <FaCheck className="text-green-600 text-lg" />
          <p className="text-green-700 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Selector de fecha y badge de rol */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FaCalendarAlt className="text-blue-600" />
              Seleccionar Fecha
            </label>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="w-full md:w-auto px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition-colors bg-gray-50"
            />
          </div>
          <div>
            {user?.role === 'admin' ? (
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg shadow-md">
                <span className="font-semibold flex items-center gap-2">
                  📊 Vista Administrador
                </span>
                <p className="text-xs mt-1 opacity-90">Ventas de todos los usuarios</p>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-lg shadow-md">
                <span className="font-semibold flex items-center gap-2">
                  👤 Mis Ventas
                </span>
                <p className="text-xs mt-1 opacity-90">Solo tus registros</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estado de carga */}
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin">
            <FaChartLine className="text-6xl text-blue-600" />
          </div>
        </div>
      ) : ventaTotal === 0 ? (
        /* Sin ventas */
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
          <FaChartLine className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            No hay ventas registradas
          </h3>
          <p className="text-gray-500">No se encontraron ventas para la fecha seleccionada: {new Date(fechaSeleccionada).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
      ) : (
        <>
          {/* Cards de resumen por categoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {datosTransformados.map((grupo, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transform hover:scale-105 transition-transform"
              >
                <div className={`bg-gradient-to-r ${obtenerColorCategoria(grupo.categoria)} p-4`}>
                  <div className="flex items-center justify-between text-white">
                    {obtenerIconoCategoria(grupo.categoria)}
                    <h3 className="text-lg font-bold uppercase">{grupo.categoria}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-2">Total vendido</p>
                  <p className="text-3xl font-bold text-green-600">${grupo.total.toFixed(2)}</p>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">{grupo.fecha}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Card de total general y exportar */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaDollarSign className="text-lg" />
                Resumen Total del Día
              </h2>
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Total */}
                <div className="text-center md:text-left">
                  <p className="text-gray-600 text-sm font-semibold mb-2">TOTAL DEL DÍA</p>
                  <p className="text-5xl font-bold text-green-600">${ventaTotal.toFixed(2)}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(fechaSeleccionada).toLocaleDateString('es-MX', { 
                      weekday: 'long', 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>

                {/* Botón de exportar mejorado */}
                <div className="text-center md:text-right">
                  <p className="text-gray-600 text-sm font-semibold mb-4">EXPORTAR DATOS</p>
                  <div onClick={handleExportarCSV}>
                    <ExportCSV
                      data={data}
                      fileName={`ventas_${fechaSeleccionada}.csv`}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    📄 {data.length} registro(s) en total
                  </p>
                </div>
              </div>

              {/* Desglose de estadísticas */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Desglose por Categoría</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {datosTransformados.map((grupo, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-600">
                      <p className="text-xs text-gray-600 font-semibold uppercase mb-1">{grupo.categoria}</p>
                      <p className="text-xl font-bold text-gray-800">${grupo.total.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {((grupo.total / ventaTotal) * 100).toFixed(1)}% del total
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
