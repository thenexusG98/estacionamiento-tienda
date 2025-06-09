// src/components/Dashboard.tsx
import {
    FaDollarSign,
    FaArrowUp,
    FaShoppingCart,
    FaExclamationTriangle,
    FaCashRegister,
    FaBoxOpen,
    FaClipboardList,
    FaChartPie,
    FaBreadSlice,
    FaEgg,
    FaGlassWhiskey,
    FaCheese,
    FaCookie,
  } from 'react-icons/fa';
  
  const currentDate = new Date().toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  
  export default function Dashboard() {
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
            value="$8,459.00"
            subtitle="12% más que ayer"
          />
          <SummaryCard
            icon={<FaShoppingCart className="text-green-600 text-xl" />}
            bgColor="bg-green-100"
            title="Transacciones"
            value="142"
            subtitle="8% más que ayer"
          />
          <SummaryCard
            icon={<FaExclamationTriangle className="text-red-600 text-xl" />}
            bgColor="bg-red-100"
            title="Productos bajos"
            value="7"
            subtitle="3 más que ayer"
          />
        </div>
  
        {/* Accesos rápidos */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Acceso Rápido</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickAccess icon={<FaCashRegister />} label="Nueva Venta" color="bg-blue-600" />
            <QuickAccess icon={<FaBoxOpen />} label="Nuevo Producto" color="bg-green-600" />
            <QuickAccess icon={<FaClipboardList />} label="Inventario" color="bg-amber-600" />
            <QuickAccess icon={<FaChartPie />} label="Reportes" color="bg-purple-600" />
          </div>
        </div>
  
        {/* Productos más vendidos (muestra fija por ahora) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Productos Más Vendidos</h3>
            <TopProduct icon={<FaBreadSlice />} name="Pan Blanco" unidades="142" porcentaje={85} />
            <TopProduct icon={<FaEgg />} name="Huevos (Docena)" unidades="98" porcentaje={70} />
            <TopProduct icon={<FaGlassWhiskey />} name="Agua Embotellada" unidades="87" porcentaje={65} />
            <TopProduct icon={<FaCheese />} name="Queso Fresco" unidades="76" porcentaje={55} />
            <TopProduct icon={<FaCookie />} name="Galletas" unidades="65" porcentaje={45} />
          </div>
  
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Ventas de la Semana</h3>
            <div className="text-gray-500">[Aquí iría un gráfico con Chart.js]</div>
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
  
  function QuickAccess({ icon, label, color }: any) {
    return (
      <button className={`quick-access-btn ${color} hover:brightness-90 text-white p-4 rounded-xl flex flex-col items-center justify-center shadow-md`}>
        <div className="text-3xl mb-2">{icon}</div>
        <span className="font-medium">{label}</span>
      </button>
    );
  }
  
  function TopProduct({ icon, name, unidades, porcentaje }: any) {
    return (
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">{icon}</div>
        <div className="flex-1">
          <div className="flex justify-between">
            <h4 className="font-medium">{name}</h4>
            <span className="text-gray-600">{unidades} unidades</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${porcentaje}%` }}></div>
          </div>
        </div>
      </div>
    );
  }
  