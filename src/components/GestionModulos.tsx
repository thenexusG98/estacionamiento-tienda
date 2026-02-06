// src/components/GestionModulos.tsx
import { useEffect, useState } from 'react';
import { FaLock, FaLockOpen, FaShieldAlt, FaDollarSign, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { obtenerModulosBloqueados, toggleModuloBloqueado, obtenerCostosServicios, actualizarCostoServicio } from '../lib/db';
import { TARIFA_BAÑO, TARIFA_PAQUETERIA } from '../lib/Constantes';

type Modulo = {
  id: number;
  modulo: string;
  bloqueado: number;
  fecha_modificacion: string | null;
  usuario_admin: string | null;
};

type CostoServicio = {
  servicio: string;
  costo: number;
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

const SERVICIOS_DISPONIBLES = [
  { key: 'baño', nombre: 'Baño', defaultCosto: TARIFA_BAÑO },
  { key: 'paqueteria', nombre: 'Paquetería', defaultCosto: TARIFA_PAQUETERIA }
];

export default function GestionModulos() {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(false);
  const [costos, setCostos] = useState<CostoServicio[]>([]);
  const [editandoServicio, setEditandoServicio] = useState<string | null>(null);
  const [nuevoCosto, setNuevoCosto] = useState<number>(0);

  useEffect(() => {
    cargarModulos();
    cargarCostos();
  }, []);

  const cargarCostos = async () => {
    try {
      const data = await obtenerCostosServicios();
      setCostos(data);
    } catch (error) {
      console.error('Error al cargar costos:', error);
    }
  };

  const obtenerCostoActual = (servicio: string): number => {
    const costoGuardado = costos.find(c => c.servicio === servicio);
    if (costoGuardado) return costoGuardado.costo;
    
    const servicioDefault = SERVICIOS_DISPONIBLES.find(s => s.key === servicio);
    return servicioDefault?.defaultCosto || 0;
  };

  const iniciarEdicion = (servicio: string) => {
    setEditandoServicio(servicio);
    setNuevoCosto(obtenerCostoActual(servicio));
  };

  const cancelarEdicion = () => {
    setEditandoServicio(null);
    setNuevoCosto(0);
  };

  const guardarCosto = async (servicio: string) => {
    if (nuevoCosto <= 0) {
      alert('El costo debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      await actualizarCostoServicio(servicio, nuevoCosto);
      await cargarCostos();
      setEditandoServicio(null);
      alert(`✅ Costo de ${SERVICIOS_DISPONIBLES.find(s => s.key === servicio)?.nombre} actualizado correctamente`);
    } catch (error) {
      console.error('Error al actualizar costo:', error);
      alert('Error al actualizar el costo del servicio');
    } finally {
      setLoading(false);
    }
  };

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

      {/* Sección de Gestión de Costos */}
      <div className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-green-600 p-3 rounded-lg">
            <FaDollarSign className="text-white text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestión de Costos de Servicios</h2>
            <p className="text-gray-600 text-sm">Configurar precios de servicios</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICIOS_DISPONIBLES.map((servicio) => {
            const costoActual = obtenerCostoActual(servicio.key);
            const costoGuardado = costos.find(c => c.servicio === servicio.key);
            const estaEditando = editandoServicio === servicio.key;

            return (
              <div
                key={servicio.key}
                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
              >
                <div className="bg-gradient-to-r from-green-600 to-green-700 p-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FaDollarSign />
                    {servicio.nombre}
                  </h3>
                </div>

                <div className="p-4 space-y-3">
                  {/* Costo actual */}
                  {!estaEditando ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Costo Actual:</span>
                        <span className="text-2xl font-bold text-green-600">${costoActual.toFixed(2)}</span>
                      </div>

                      <div className="text-xs text-gray-500">
                        {costoGuardado ? (
                          <>
                            <p>💾 Guardado en BD</p>
                            {costoGuardado.fecha_modificacion && (
                              <p className="mt-1">
                                Modificado: {new Date(costoGuardado.fecha_modificacion).toLocaleString('es-MX')}
                              </p>
                            )}
                            {costoGuardado.usuario_admin && (
                              <p>Por: {costoGuardado.usuario_admin}</p>
                            )}
                          </>
                        ) : (
                          <p>📋 Usando valor por defecto de constantes</p>
                        )}
                      </div>

                      <button
                        onClick={() => iniciarEdicion(servicio.key)}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold disabled:opacity-50"
                      >
                        <FaEdit />
                        Modificar Precio
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nuevo Costo:
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={nuevoCosto}
                          onChange={(e) => setNuevoCosto(Number(e.target.value))}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none"
                          placeholder="0.00"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => guardarCosto(servicio.key)}
                          disabled={loading}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold disabled:opacity-50"
                        >
                          <FaSave />
                          Guardar
                        </button>
                        <button
                          onClick={cancelarEdicion}
                          disabled={loading}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all font-semibold disabled:opacity-50"
                        >
                          <FaTimes />
                          Cancelar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Importante</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Los costos modificados se guardan en la base de datos</li>
            <li>• Si no hay un costo guardado, se usa el valor por defecto de las constantes</li>
            <li>• Los cambios se aplican inmediatamente en todos los módulos</li>
            <li>• Esta función es exclusiva para administradores</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
