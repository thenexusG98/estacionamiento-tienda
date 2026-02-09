// src/components/Sidebar.jsx
import { useState, useEffect } from 'react';
import {
  FaStore,
  FaTachometerAlt,
  FaCashRegister,
  FaBoxes,
  FaBoxOpen,
  FaChartBar,
  FaSignOutAlt,
  FaCar,
  FaToilet,
  FaArchive,
  FaUsers,
  FaFileAlt,
  FaShieldAlt,
  FaChevronRight,
  FaLock,
  FaCrown,
} from 'react-icons/fa';
import { User } from '../hooks/useAuth';
import { APP_VERSION } from '../lib/version';
import { verificarModuloBloqueado } from '../lib/db';

interface SidebarProps {
  setSection: (section: string) => void;
  user: User | null;
  onLogout: () => void;
  currentSection?: string;
}

export default function Sidebar({ setSection, user, onLogout, currentSection }: SidebarProps) {
  const [active, setActive] = useState('dashboard');
  const [modulosBloqueados, setModulosBloqueados] = useState<Record<string, boolean>>({});

  // Sincronizar el estado activo con la sección actual
  useEffect(() => {
    if (currentSection) {
      setActive(currentSection);
    }
  }, [currentSection]);

  useEffect(() => {
    // Cargar estado de módulos bloqueados solo para empleados
    if (user?.role !== 'admin') {
      cargarModulosBloqueados();
    }
  }, [user]);

  const cargarModulosBloqueados = async () => {
    const modulos = ['dashboard', 'estacionamiento', 'baños', 'paqueteria', 'ventas', 'inventario', 'productos', 'reportes'];
    const estados: Record<string, boolean> = {};
    
    for (const modulo of modulos) {
      try {
        const bloqueado = await verificarModuloBloqueado(modulo);
        estados[modulo] = bloqueado;
      } catch (error) {
        console.error(`Error al verificar módulo ${modulo}:`, error);
        estados[modulo] = false;
      }
    }
    
    setModulosBloqueados(estados);
  };

  const handleClick = (section: string, bloqueado: boolean) => {
    if (bloqueado && user?.role !== 'admin') {
      alert('⚠️ Este módulo no está disponible actualmente. Contacta al administrador.');
      return;
    }
    setSection(section);
    setActive(section);
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro que deseas cerrar sesión?')) {
      onLogout();
    }
  };

  const menuItems = [
    { icon: <FaTachometerAlt />, label: 'Dashboard', key: 'dashboard' },
    { icon: <FaCar />, label: 'Estacionamiento', key: 'estacionamiento' },
    { icon: <FaToilet  />, label: 'Baños', key: 'baños' },
    { icon: <FaArchive />, label: 'Paqueteria', key: 'paqueteria' },
    { icon: <FaCashRegister />, label: 'Ventas', key: 'ventas' },
    { icon: <FaBoxes />, label: 'Inventario', key: 'inventario' },
    { icon: <FaBoxOpen />, label: 'Registrar Productos', key: 'productos' },
    { icon: <FaChartBar />, label: 'Reportes', key: 'reportes' },
    ...(user?.role === 'admin' ? [
      { icon: <FaUsers />, label: 'Usuarios', key: 'usuarios' },
      { icon: <FaShieldAlt />, label: 'Gestión Módulos', key: 'gestion-modulos' },
      { icon: <FaFileAlt />, label: 'Bitácora Logs', key: 'bitacora' }
    ] : []),
  ];

  // Filtrar módulos bloqueados para empleados
  const menuItemsFiltrados = user?.role === 'admin' 
    ? menuItems 
    : menuItems.filter(item => !modulosBloqueados[item.key]);

  return (
    <div className="sidebar bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white w-72 py-6 px-4 flex flex-col shadow-2xl">
      {/* Header mejorado */}
      <div className="mb-8 px-3">
        <div className="flex items-center justify-center gap-3 mb-4 bg-gradient-to-r from-blue-600 to-blue-500 p-4 rounded-xl shadow-lg">
          <FaStore className="text-4xl" />
          <div>
            <h1 className="text-2xl font-bold">Mi Tienda</h1>
            <p className="text-xs opacity-90">Sistema de Gestión</p>
          </div>
        </div>
        
        {/* Badge de rol */}
        {user?.role === 'admin' && (
          <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 p-2 rounded-lg flex items-center justify-center gap-2 shadow-md">
            <FaCrown className="text-sm" />
            <span className="text-xs font-bold">ADMINISTRADOR</span>
          </div>
        )}
      </div>

      {/* Navegación mejorada */}
      <nav className="flex-1 overflow-y-auto px-2">
        <ul className="space-y-1">
          {menuItemsFiltrados.map(({ icon, label, key }) => {
            const bloqueado = modulosBloqueados[key] || false;
            const esAdmin = user?.role === 'admin';
            const isActive = active === key;
            
            return (
              <li key={key}>
                <button
                  onClick={() => handleClick(key, bloqueado)}
                  className={`group relative flex items-center py-3.5 px-4 rounded-xl w-full text-left transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/50 scale-105' 
                      : 'hover:bg-slate-700/50 hover:scale-102 hover:translate-x-1'
                  }`}
                >
                  {/* Indicador activo */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                  )}
                  
                  {/* Icono */}
                  <span className={`text-xl mr-4 ${isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'} transition-colors`}>
                    {icon}
                  </span>
                  
                  {/* Label */}
                  <span className={`flex-1 font-medium ${isActive ? 'text-white font-semibold' : 'text-gray-300 group-hover:text-white'} transition-colors`}>
                    {label}
                  </span>
                  
                  {/* Indicadores */}
                  {bloqueado && esAdmin && (
                    <FaLock className="text-yellow-400 text-xs ml-2" />
                  )}
                  
                  {isActive && (
                    <FaChevronRight className="text-white text-sm ml-2" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer del usuario mejorado */}
      <div className="mt-6 pt-6 border-t border-slate-700 px-2">
        <div className="bg-slate-800/50 rounded-xl p-4 mb-4 backdrop-blur-sm border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <span className="font-bold text-lg">
                  {user?.username?.substring(0, 2).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{user?.name || 'Usuario'}</p>
              <p className="text-xs text-blue-300 capitalize">{user?.role || 'Usuario'}</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="group flex items-center justify-center gap-2 py-3 px-4 rounded-xl w-full bg-red-600/10 hover:bg-red-600 border border-red-600/30 hover:border-red-600 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/50"
        >
          <FaSignOutAlt className="text-red-400 group-hover:text-white transition-colors" />
          <span className="font-medium text-red-400 group-hover:text-white transition-colors">Cerrar sesión</span>
        </button>
        
        {/* Versión de la aplicación */}
        <div className="mt-3 text-center">
          <p className="text-xs text-blue-300">
            v{APP_VERSION}
          </p>
        </div>
      </div>
    </div>
  );
}
