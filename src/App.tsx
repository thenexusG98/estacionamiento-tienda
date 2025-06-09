import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Ventas from './components/Ventas';
import Inventario from './components/Inventario';
import Productos from './components/Productos';
import Reportes from './components/Reportes';
import { useState } from 'react';
import './App.css'

export default function App() {
  const [section, setSection] = useState('dashboard');

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar setSection={setSection} />
      <div className="flex-1 overflow-y-auto">
        {section === 'dashboard' && <Dashboard />}
        {section === 'ventas' && <Ventas />}
        {section === 'inventario' && <Inventario />}
        {section === 'productos' && <Productos />}
        {section === 'reportes' && <Reportes />}
      </div>
    </div>
  );
}