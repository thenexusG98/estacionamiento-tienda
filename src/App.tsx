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
import UpdateChecker from './components/UpdateChecker';

import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import './App.css'

export default function App() {
  const [section, setSection] = useState('dashboard');
  const { isAuthenticated, user, isLoading, logout } = useAuth();

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
      <UpdateChecker />
      <Sidebar setSection={setSection} user={user} onLogout={logout} />
      <div className="flex-1 overflow-y-auto">
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
      </div>
    </div>
  );
}