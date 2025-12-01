// src/components/GestionModulos.tsx
import { useEffect, useState } from 'react';
import { FaLock, FaLockOpen, FaShieldAlt } from 'react-icons/fa';
import { obtenerModulosBloqueados, toggleModuloBloqueado } from '../lib/db';

type Modulo = {
  id: number;
  modulo: string;
  bloqueado: number;
  fecha_modificacion: string | null;
  usuario_admin: string | null;
};

const NOMBRES_MODULOS: Record<string, string> = {
  dashboard: 'Dashboard',
  estacionamiento: 'Estacionamiento',
  baños: 'Baños',
  paqueteria: 'Paquetería',
  ventas: 'Ventas',
  inventario: 'Inventario',
  productos: 'Registrar Productos',
  reportes: 'Reportes'
};

export default function GestionModulos() {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarModulos();
  }, []);

  const cargarModulos = async () => {
    try {
      const data = await obtenerModulosBloqueados();
      setModulos(data);
    } catch (error) {
      console.error('Error al cargar módulos:', error);
      alert('Error al cargar la lista de módulos');
    }
  };

  const handleToggle = async (modulo: string, bloqueadoActual: number) => {
    setLoading(true);
    try {
      const nuevoBloqueado = bloqueadoActual === 0;
      await toggleModuloBloqueado(modulo, nuevoBloqueado);
      await cargarModulos(); // Recargar lista
      
      const accion = nuevoBloqueado ? 'bloqueado' : 'desbloqueado';
      alert(`✅ Módulo "${NOMBRES_MODULOS[modulo]}" ${accion} correctamente`);
    } catch (error) {
      console.error('Error al cambiar estado del módulo:', error);
      alert('Error al cambiar el estado del módulo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FaShieldAlt className="text-3xl text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Módulos</h2>
          <p className="text-gray-600 text-sm">Bloquear/Desbloquear acceso a módulos para empleados</p>
        </div>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Nota:</strong> Los módulos bloqueados NO serán accesibles para usuarios con rol <strong>empleado</strong>. 
              El rol <strong>admin</strong> siempre tendrá acceso completo.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modulos.map((mod) => (
          <div
            key={mod.id}
            className={`border rounded-lg p-4 transition-all ${
              mod.bloqueado === 1
                ? 'bg-red-50 border-red-300'
                : 'bg-green-50 border-green-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {mod.bloqueado === 1 ? (
                  <FaLock className="text-red-600" />
                ) : (
                  <FaLockOpen className="text-green-600" />
                )}
                {NOMBRES_MODULOS[mod.modulo] || mod.modulo}
              </h3>
            </div>

            <div className="mb-3 text-sm text-gray-600">
              <p>
                <strong>Estado:</strong>{' '}
                <span
                  className={`font-semibold ${
                    mod.bloqueado === 1 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {mod.bloqueado === 1 ? '🔒 Bloqueado' : '✅ Activo'}
                </span>
              </p>
              {mod.fecha_modificacion && (
                <p className="text-xs mt-1">
                  Última modificación: {new Date(mod.fecha_modificacion).toLocaleString('es-MX')}
                  {mod.usuario_admin && ` por ${mod.usuario_admin}`}
                </p>
              )}
            </div>

            <button
              onClick={() => handleToggle(mod.modulo, mod.bloqueado)}
              disabled={loading}
              className={`w-full px-4 py-2 rounded font-semibold transition-all ${
                mod.bloqueado === 1
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Procesando...' : mod.bloqueado === 1 ? 'Desbloquear' : 'Bloquear'}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Los módulos bloqueados aparecerán deshabilitados en el menú lateral</li>
          <li>• Al intentar acceder, se mostrará un mensaje de "Módulo no disponible"</li>
          <li>• Todos los cambios quedan registrados en la bitácora del sistema</li>
          <li>• Esta función es exclusiva para administradores</li>
        </ul>
      </div>
    </div>
  );
}
