import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Ventas from './components/Ventas';
import Inventario from './components/Inventario';
import Productos from './components/Productos';
import Reportes from './components/Reportes';
import VentasRegistradas from './components/VentasRegistradas';
import Estacionamiento from './components/Estacionamiento';
import Baños from './components/Baños';
import Paqueteria from './components/Paqueteria';
import Login from './components/Login';
import Usuarios from './components/Usuarios';
import BitacoraLogs from './components/BitacoraLogs';
import GestionModulos from './components/GestionModulos';

import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { verificarModuloBloqueado } from './lib/db';
import './App.css'

// Componente para mostrar cuando un módulo está bloqueado
function ModuloBloqueado() {
  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Módulo No Disponible</h2>
        <p className="text-gray-600 mb-4">
          Este módulo ha sido temporalmente deshabilitado por el administrador.
        </p>
        <p className="text-sm text-gray-500">
          Si necesitas acceso a este módulo, por favor contacta al administrador del sistema.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [section, setSection] = useState('dashboard');
  const [modulosBloqueados, setModulosBloqueados] = useState<Record<string, boolean>>({});
  const { isAuthenticated, user, isLoading, logout } = useAuth();

  // Cargar módulos bloqueados para empleados
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'admin') {
      cargarModulosBloqueados();
    }
  }, [isAuthenticated, user]);

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

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return <Login />;
  }

  // Si está autenticado, mostrar la aplicación principal
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar setSection={setSection} user={user} onLogout={logout} currentSection={section} />
      <div className="flex-1 overflow-y-auto">
        {/* Verificar si el módulo está bloqueado para empleados */}
        {user?.role !== 'admin' && modulosBloqueados[section] ? (
          <ModuloBloqueado />
        ) : (
          <>
            {section === 'dashboard' && <Dashboard setSection={setSection} />}
            {section === 'ventas' && <Ventas />}
            {section === 'inventario' && <Inventario />}
            {section === 'productos' && <Productos />}
            {section === 'reportes' && <Reportes />}
            {section === 'ventas-registradas' && <VentasRegistradas />}
            {section === 'estacionamiento' && <Estacionamiento />}
            {section === 'baños' && <Baños />}
            {section === 'paqueteria' && <Paqueteria />}
            {section === 'usuarios' && user?.role === 'admin' && <Usuarios />}
            {section === 'gestion-modulos' && user?.role === 'admin' && <GestionModulos />}
            {section === 'bitacora' && user?.role === 'admin' && <BitacoraLogs />}
          </>
        )}
      </div>
    </div>
  );
}