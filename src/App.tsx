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

import { useState } from 'react';
import './App.css'

export default function App() {
  const [section, setSection] = useState('dashboard');

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar setSection={setSection} />
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
      </div>
    </div>
  );
}