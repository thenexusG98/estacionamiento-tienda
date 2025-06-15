// src/components/Dashboard.tsx
import { useEffect, useState } from 'react';
import { obtenerResumenDelDia, contarProductosBajos, obtenerProductosMasVendidos,
  registrarBaño
 } from '../lib/db';

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
    FaToilet
  } from 'react-icons/fa';
  
  const currentDate = new Date().toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  
  export default function Dashboard({ setSection }: { setSection: (section: string) => void }) {
    const [resumen, setResumen] = useState({ total: 0,  transaccion: 0 });
    console.log('Resumen del día:', resumen.transaccion);
    
    const [productosBajos, setProductosBajos] = useState(0);
    const [masVendidos, setMasVendidos] = useState<any[]>([]);
    //const [monto, setMonto] = useState<number | null>(null);
    const montoFijo = 5;
    
    const registrarUsoBaño = async () => {

        /*if (monto === null) {
          alert('Por favor, ingrese un monto válido.');
          return;
        }*/
    
        const fechaHora = new Date().toISOString().slice(0, 10);
        await registrarBaño(fechaHora, montoFijo);
        alert('Uso del baño registrado correctamente.');
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
  };

  cargarDatos();
}, []);


    return (
      <div className="p-6">
        {/* Título */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <div className="flex items-center">
            <span className="text-gray-500 mr-2">Hoy:</span>
            <span className="font-medium">{currentDate}</span>
          </div>
        </div>
  
        {/* Tarjetas resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SummaryCard
            icon={<FaDollarSign className="text-blue-600 text-xl" />}
            bgColor="bg-blue-100"
            title="Ventas del día"
            value={`$${(resumen.total || 0).toFixed(2)}`}
            subtitle="Ventas del dia de hoy"
          />
          <SummaryCard
            icon={<FaShoppingCart className="text-green-600 text-xl" />}
            bgColor="bg-green-100"
            title="Transacciones"
            value={(resumen.transaccion || 0).toFixed(2)}
            subtitle="Total de ventas realizadas hoy"
          />
          <SummaryCard
            icon={<FaExclamationTriangle className="text-red-600 text-xl" />}
            bgColor="bg-red-100"
            title="Productos bajos"
            value={productosBajos.toString()}
            subtitle="Productos con stock bajo"
          />
        </div>
  
        {/* Accesos rápidos */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Acceso Rápido</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickAccess
              icon={<FaCashRegister />}
              label="Nueva Venta"
              color="bg-blue-600"
              onClick={() => setSection('ventas')}
            />
            <QuickAccess
              icon={<FaBoxOpen />}
              label="Nuevo Producto"
              color="bg-green-600"
              onClick={() => setSection('productos')}
            />
            <QuickAccess
              icon={<FaClipboardList />}
              label="Inventario"
              color="bg-amber-600"
              onClick={() => setSection('inventario')}
            />
            <QuickAccess
              icon={<FaChartPie />}
              label="Reportes"
              color="bg-purple-600"
              onClick={() => setSection('reportes')}
            />
            <QuickAccess
              icon={<FaToilet />}
              label="Registrar Baño"
              color="bg-blue-400"
              onClick={() => registrarUsoBaño()}
            />
          </div>
        </div>
  
        {/* Productos más vendidos (muestra fija por ahora) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Productos Más Vendidos
          </h3>
          {masVendidos.length === 0 ? (
            <p className="text-gray-500">No hay ventas registradas aún.</p>
          ) : (
            masVendidos.map((p, index) => (
              <div className="flex items-center mb-4" key={index}>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <FaStar className="text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between font-medium">
                    <span>{p.producto}</span>
                    <span>{p.cantidad_total} unidades</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Total vendido: ${p.total_vendido.toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* puedes dejar la otra mitad para ventas de la semana o gráfico */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Ventas de la Semana</h3>
          <div className="text-gray-500">[Aquí puedes insertar Chart.js]</div>
        </div>
      </div>
      </div>
    );
  }
  
  // COMPONENTES SECUNDARIOS
  function SummaryCard({ icon, bgColor, title, value, subtitle }: any) {
    return (
      <div className="dashboard-card bg-white p-6 shadow-md rounded-xl">
        <div className="flex items-center">
          <div className={`rounded-full ${bgColor} p-3 mr-4`}>{icon}</div>
          <div>
            <h3 className="text-gray-500 text-sm">{title}</h3>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-green-600 flex items-center">
              <FaArrowUp className="mr-1" />
              <span>{subtitle}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  function QuickAccess({ icon, label, color, onClick }: any) {
    return (
      <button
        className={`quick-access-btn ${color} hover:brightness-90 text-white p-4 rounded-xl flex flex-col items-center justify-center shadow-md`}
        onClick={onClick}
      >
        <div className="text-3xl mb-2">{icon}</div>
        <span className="font-medium">{label}</span>
      </button>
    );
  }


