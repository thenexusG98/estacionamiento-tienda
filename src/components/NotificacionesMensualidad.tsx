import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { FaBell, FaTimes, FaExclamationCircle, FaDollarSign } from 'react-icons/fa';

interface Notificacion {
  mensaje: string;
  monto: number;
  fecha_vencimiento: string;
  timestamp: string;
}

export default function NotificacionesMensualidad() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [nuevasNotificaciones, setNuevasNotificaciones] = useState(0);

  useEffect(() => {
    // Cargar notificaciones pendientes al iniciar
    cargarNotificaciones();

    // Escuchar nuevas notificaciones
    const unlisten = listen<Notificacion>('nueva-notificacion-mensualidad', (event) => {
      console.log('📨 Nueva notificación recibida:', event.payload);
      setNotificaciones((prev) => [...prev, event.payload]);
      setNuevasNotificaciones((prev) => prev + 1);
      
      // Mostrar notificación del sistema
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('💳 Recordatorio de Mensualidad', {
          body: event.payload.mensaje,
          icon: '/icon.png',
        });
      }
    });

    // Solicitar permisos de notificaciones
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const cargarNotificaciones = async () => {
    try {
      const notifs = await invoke<Notificacion[]>('obtener_notificaciones_pendientes');
      setNotificaciones(notifs);
      setNuevasNotificaciones(notifs.length);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  };

  const marcarComoLeida = async (index: number) => {
    try {
      await invoke('marcar_notificacion_leida', { index });
      setNotificaciones((prev) => prev.filter((_, i) => i !== index));
      setNuevasNotificaciones((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };

  const formatearFecha = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return fechaStr;
    }
  };

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        onClick={() => {
          setMostrarPanel(!mostrarPanel);
          if (!mostrarPanel) setNuevasNotificaciones(0);
        }}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        title="Notificaciones de mensualidad"
      >
        <FaBell className="text-xl text-gray-700" />
        {nuevasNotificaciones > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
            {nuevasNotificaciones}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {mostrarPanel && (
        <>
          {/* Overlay para cerrar al hacer clic afuera */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMostrarPanel(false)}
          />
          
          <div className="absolute left-12 bottom-0 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[500px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaBell className="text-xl" />
                  <h3 className="font-semibold text-lg">Notificaciones</h3>
                </div>
                <button
                  onClick={() => setMostrarPanel(false)}
                  className="hover:bg-white/20 p-1 rounded transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
              {notificaciones.length > 0 && (
                <p className="text-sm text-blue-100 mt-1">
                  {notificaciones.length} pendiente{notificaciones.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Lista de notificaciones */}
            <div className="overflow-y-auto flex-1">
              {notificaciones.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FaBell className="text-4xl mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No hay notificaciones pendientes</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notificaciones.map((notif, index) => (
                    <div
                      key={index}
                      className="p-4 hover:bg-gray-50 transition-colors relative group"
                    >
                      {/* Botón para marcar como leída */}
                      <button
                        onClick={() => marcarComoLeida(index)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-200 hover:bg-red-500 hover:text-white text-gray-600 p-1 rounded"
                        title="Marcar como leída"
                      >
                        <FaTimes className="text-xs" />
                      </button>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <FaExclamationCircle className="text-red-600 text-lg" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            💳 Recordatorio de Mensualidad
                          </p>
                          
                          <p className="text-sm text-gray-700 mb-2">
                            {notif.mensaje}
                          </p>

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <FaDollarSign className="text-green-600" />
                              <span className="font-semibold text-green-700">
                                ${notif.monto.toFixed(2)}
                              </span>
                            </div>
                            
                            <div>
                              📅 Vence: {formatearFecha(notif.fecha_vencimiento)}
                            </div>
                          </div>

                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notif.timestamp).toLocaleString('es-MX')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer con acciones */}
            {notificaciones.length > 0 && (
              <div className="border-t border-gray-200 p-3 bg-gray-50">
                <button
                  onClick={async () => {
                    // Marcar todas como leídas
                    for (let i = notificaciones.length - 1; i >= 0; i--) {
                      await marcarComoLeida(i);
                    }
                  }}
                  className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium py-2 hover:bg-blue-50 rounded transition-colors"
                >
                  Marcar todas como leídas
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
