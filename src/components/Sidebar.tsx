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
} from 'react-icons/fa';
import { User } from '../hooks/useAuth';
import { verificarModuloBloqueado } from '../lib/db';

interface SidebarProps {
  setSection: (section: string) => void;
  user: User | null;
  onLogout: () => void;
}

export default function Sidebar({ setSection, user, onLogout }: SidebarProps) {
  const [active, setActive] = useState('dashboard');
  const [modulosBloqueados, setModulosBloqueados] = useState<Record<string, boolean>>({});

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
    <div className="sidebar bg-gradient-to-b from-blue-600 to-blue-800 text-white w-64 py-4 px-6 flex flex-col">
      <div className="flex items-center mb-8">
        <FaStore className="text-3xl mr-3" />
        <h1 className="text-xl font-bold">Mi Tienda</h1>
      </div>

      <nav className="flex-1">
        <ul>
          {menuItemsFiltrados.map(({ icon, label, key }) => {
            const bloqueado = modulosBloqueados[key] || false;
            const esAdmin = user?.role === 'admin';
            
            return (
              <li key={key} className="mb-1">
                <button
                  onClick={() => handleClick(key, bloqueado)}
                  className={`menu-item flex items-center py-3 px-4 rounded-lg w-full text-left relative ${
                    active === key 
                      ? 'bg-blue-400 bg-opacity-10 border-l-4 border-blue-400' 
                      : 'hover:bg-blue-300 hover:bg-opacity-10'
                  }`}
                >
                  <span className="w-6 mr-3">{icon}</span>
                  <span>{label}</span>
                  {bloqueado && esAdmin && (
                    <span className="ml-auto text-xs text-yellow-300">🔒</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto pt-4 border-t border-blue-500">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center">
            <span className="font-bold text-lg">
              {user?.username?.substring(0, 2).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="ml-3">
            <p className="font-medium">{user?.name || 'Usuario'}</p>
            <p className="text-xs text-blue-200">{user?.role || 'Usuario'}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="mt-4 flex items-center text-sm text-blue-200 hover:text-white transition-colors duration-200 w-full text-left"
        >
          <FaSignOutAlt className="mr-2" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}
