// src/components/Dashboard.tsx
import { useEffect, useState } from 'react';
import { obtenerResumenDelDia, contarProductosBajos, obtenerProductosMasVendidos,
  registrarBaño, verificarModuloBloqueado
 } from '../lib/db';
import { TARIFA_BAÑO} from '../lib/Constantes';
import { useAuth } from '../contexts/AuthContext';

// Función helper para obtener fecha local
function obtenerFechaLocal(): string {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

import {
    FaDollarSign,
    FaArrowUp,
    FaShoppingCart,
    FaExclamationTriangle,
    FaCashRegister,
    FaBoxOpen,
    FaClipboardList,
    FaChartPie,
    FaStar,
    FaToilet,
    FaArchive,
    FaTachometerAlt,
    FaCheck,
    FaTrophy
  } from 'react-icons/fa';
  
  
  export default function Dashboard({ setSection }: { setSection: (section: string) => void }) {
    const { user } = useAuth();
    const [resumen, setResumen] = useState({ total: 0,  transaccion: 0 });
    console.log('Resumen del día:', resumen.transaccion);
    
    const [productosBajos, setProductosBajos] = useState(0);
    const [masVendidos, setMasVendidos] = useState<any[]>([]);
    const [modulosBloqueados, setModulosBloqueados] = useState<Record<string, boolean>>({});
    const [successMessage, setSuccessMessage] = useState('');
    const montoFijo = TARIFA_BAÑO;
    
    const currentDate = new Date().toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const registrarUsoBaño = async () => {
        const fechaHora = obtenerFechaLocal();
        await registrarBaño(fechaHora, montoFijo);
        
        alert(`✅ ¡USO DE BAÑO REGISTRADO EXITOSAMENTE!\n\n🚻 Detalles:\n• Monto Cobrado: $${montoFijo.toFixed(2)}\n• Fecha: ${fechaHora}\n\n¡Registro completado!`);
        
        setSuccessMessage('✅ Uso de baño registrado correctamente');
        setTimeout(() => setSuccessMessage(''), 3000);
        
        // Recargar datos
        const res = await obtenerResumenDelDia();
        setResumen(res);
      };

    useEffect(() => {
  const cargarDatos = async () => {
    try {
      const res = await obtenerResumenDelDia();
      setResumen(res);
    } catch (e) {
      console.error('Error en obtenerResumenDelDia:', e);
    }

    try {
      const bajos = await contarProductosBajos();
      setProductosBajos(bajos);
    } catch (e) {
      console.error('Error en contarProductosBajos:', e);
    }

    try {
      const masVend = await obtenerProductosMasVendidos();
      setMasVendidos(masVend);
    } catch (e) {
      console.error('Error en obtenerProductosMasVendidos:', e);
    }

    // Cargar módulos bloqueados si no es admin
    if (user?.role !== 'admin') {
      try {
        const modulos = ['ventas', 'productos', 'inventario', 'reportes', 'baños', 'paqueteria'];
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

  cargarDatos();
}, [user]);


    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 lg:p-8">
        {/* Encabezado */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-3 rounded-lg">
                <FaTachometerAlt className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-gray-600 text-sm mt-1">Vista general de tu negocio</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              {user?.role === 'admin' ? (
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg shadow-md">
                  <span className="text-sm font-semibold flex items-center gap-2">
                    📊 Vista Administrador
                  </span>
                  <p className="text-xs opacity-90">Datos de todos los usuarios</p>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded-lg shadow-md">
                  <span className="text-sm font-semibold flex items-center gap-2">
                    👤 Mi Dashboard
                  </span>
                  <p className="text-xs opacity-90">Vista personal</p>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">{currentDate}</p>
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
  
        {/* Tarjetas resumen mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transform hover:scale-105 transition-transform">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
              <div className="flex items-center justify-between text-white">
                <FaDollarSign className="text-3xl" />
                <div className="text-right">
                  <p className="text-sm opacity-90">Ventas del Día</p>
                  <p className="text-2xl font-bold">${(resumen.total || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-blue-50">
              <p className="text-xs text-blue-700 flex items-center gap-1">
                <FaArrowUp />
                <span>Total acumulado hoy</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transform hover:scale-105 transition-transform">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-4">
              <div className="flex items-center justify-between text-white">
                <FaShoppingCart className="text-3xl" />
                <div className="text-right">
                  <p className="text-sm opacity-90">Transacciones</p>
                  <p className="text-2xl font-bold">{(resumen.transaccion || 0)}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-green-50">
              <p className="text-xs text-green-700 flex items-center gap-1">
                <FaArrowUp />
                <span>Ventas realizadas hoy</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transform hover:scale-105 transition-transform">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-4">
              <div className="flex items-center justify-between text-white">
                <FaExclamationTriangle className="text-3xl" />
                <div className="text-right">
                  <p className="text-sm opacity-90">Stock Bajo</p>
                  <p className="text-2xl font-bold">{productosBajos}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-red-50">
              <p className="text-xs text-red-700 flex items-center gap-1">
                <FaExclamationTriangle />
                <span>Productos con stock crítico</span>
              </p>
            </div>
          </div>
        </div>
  
        {/* Accesos rápidos mejorados */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FaCashRegister className="text-lg" />
                Acceso Rápido
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Ventas */}
                {(user?.role === 'admin' || !modulosBloqueados['ventas']) && (
                  <button
                    className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-6 rounded-xl flex flex-col items-center justify-center shadow-lg transition-all transform hover:scale-105"
                    onClick={() => setSection('ventas')}
                  >
                    <FaCashRegister className="text-4xl mb-3" />
                    <span className="font-semibold text-sm text-center">Nueva Venta</span>
                  </button>
                )}
                
                {/* Productos */}
                {(user?.role === 'admin' || !modulosBloqueados['productos']) && (
                  <button
                    className="bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white p-6 rounded-xl flex flex-col items-center justify-center shadow-lg transition-all transform hover:scale-105"
                    onClick={() => setSection('productos')}
                  >
                    <FaBoxOpen className="text-4xl mb-3" />
                    <span className="font-semibold text-sm text-center">Nuevo Producto</span>
                  </button>
                )}
                
                {/* Inventario */}
                {(user?.role === 'admin' || !modulosBloqueados['inventario']) && (
                  <button
                    className="bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white p-6 rounded-xl flex flex-col items-center justify-center shadow-lg transition-all transform hover:scale-105"
                    onClick={() => setSection('inventario')}
                  >
                    <FaClipboardList className="text-4xl mb-3" />
                    <span className="font-semibold text-sm text-center">Inventario</span>
                  </button>
                )}
                
                {/* Reportes */}
                {(user?.role === 'admin' || !modulosBloqueados['reportes']) && (
                  <button
                    className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-6 rounded-xl flex flex-col items-center justify-center shadow-lg transition-all transform hover:scale-105"
                    onClick={() => setSection('reportes')}
                  >
                    <FaChartPie className="text-4xl mb-3" />
                    <span className="font-semibold text-sm text-center">Reportes</span>
                  </button>
                )}
                
                {/* Baños */}
                {(user?.role === 'admin' || !modulosBloqueados['baños']) && (
                  <button
                    className="bg-gradient-to-br from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white p-6 rounded-xl flex flex-col items-center justify-center shadow-lg transition-all transform hover:scale-105"
                    onClick={() => registrarUsoBaño()}
                  >
                    <FaToilet className="text-4xl mb-3" />
                    <span className="font-semibold text-sm text-center">Registrar Baño</span>
                  </button>
                )}
                
                {/* Paquetería */}
                {(user?.role === 'admin' || !modulosBloqueados['paqueteria']) && (
                  <button
                    className="bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white p-6 rounded-xl flex flex-col items-center justify-center shadow-lg transition-all transform hover:scale-105"
                    onClick={() => setSection('paqueteria')}
                  >
                    <FaArchive className="text-4xl mb-3" />
                    <span className="font-semibold text-sm text-center">Paquetería</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
  
        {/* Productos más vendidos mejorado */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 p-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FaTrophy className="text-lg" />
              Productos Más Vendidos
            </h3>
          </div>
          <div className="p-6">
            {masVendidos.length === 0 ? (
              <div className="text-center py-8">
                <FaStar className="text-5xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No hay ventas registradas aún</p>
                <p className="text-gray-400 text-sm">Los productos más vendidos aparecerán aquí</p>
              </div>
            ) : (
              <div className="space-y-4">
                {masVendidos.map((p, index) => (
                  <div
                    key={index}
                    className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 text-white font-bold text-lg mr-4 shadow-lg">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-gray-800 text-lg">{p.producto}</span>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {p.cantidad_total} unidades
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FaDollarSign className="text-green-600 mr-1" />
                        <span className="font-semibold text-green-600">
                          ${p.total_vendido.toFixed(2)}
                        </span>
                        <span className="ml-2">vendido en total</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }


