import { useState, useEffect } from "react";
import { registrarEntregaPaquete, registrarRecoleccionPaquete, obtenerPaquetesPendientesPorUsuario } from "../lib/db";
import { createPdfPaqueteria } from "../lib/CreateTicket";
import { TARIFA_PAQUETERIA } from "../lib/Constantes";
import { useAuth } from "../hooks/useAuth";
import { FaBox, FaClock, FaPlus, FaQrcode, FaDollarSign, FaCheck, FaTimes } from "react-icons/fa";
import { logger, LogCategory } from "../lib/Logger";

// Función helper para obtener fecha y hora local
function obtenerFechaHoraLocal(): string {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  const horas = String(ahora.getHours()).padStart(2, '0');
  const minutos = String(ahora.getMinutes()).padStart(2, '0');
  const segundos = String(ahora.getSeconds()).padStart(2, '0');
  return `${año}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
}

export default function Paqueteria() {
  const [paqueteId, setPaqueteId] = useState<number | null>(null);
  const [paquetesPendientes, setPaquetesPendientes] = useState<{
    id: number;
    fecha_entrega: string;
    usuario_nombre: string;
  }[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Cargar paquetes pendientes al montar el componente
  useEffect(() => {
    cargarPaquetesPendientes();
  }, []);

  const cargarPaquetesPendientes = async () => {
    setLoading(true);
    try {
      const paquetes = await obtenerPaquetesPendientesPorUsuario();
      setPaquetesPendientes(paquetes);
    } catch (error) {
      logger.error(
        LogCategory.PAQUETERIA,
        'Error al cargar paquetes pendientes',
        {},
        error instanceof Error ? error : undefined
      );
      console.error('Error al cargar paquetes pendientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularTiempoTranscurrido = (fechaEntrega: string): string => {
    const ahora = new Date();
    const entrada = new Date(fechaEntrega);
    const diffMs = ahora.getTime() - entrada.getTime();
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHoras}h ${diffMinutos}m`;
  };

  const handleGuardarPaquete = async () => {
    try {
      const fecha = obtenerFechaHoraLocal();
      const id = await registrarEntregaPaquete(fecha);

      logger.info(
        LogCategory.PAQUETERIA,
        `Paquete registrado para entrega`,
        {
          paqueteId: id,
          fecha,
          usuario: user?.name || 'Sin sesión'
        }
      );

      // Imprimir 2 tickets
      await createPdfPaqueteria({id});

      // Mostrar alerta de éxito
      alert(`✅ ¡PAQUETE REGISTRADO EXITOSAMENTE!\n\n📦 Detalles:\n• Ticket ID: #${id}\n• Fecha: ${fecha}\n• Usuario: ${user?.name || 'Sin sesión'}\n\n¡Tickets generados!`);
      
      setSuccessMessage('✅ Paquete registrado correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Recargar la lista de paquetes pendientes
      cargarPaquetesPendientes();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      
      logger.error(
        LogCategory.PAQUETERIA,
        `❌ Error al registrar entrega de paquete: ${errorMsg}`,
        { usuario: user?.name },
        error instanceof Error ? error : undefined
      );

      console.error('Error al guardar paquete:', error);
      alert(`❌ Error al registrar el paquete: ${errorMsg}`);
    }
  };

  const handleRecolectarPaquete = async () => {
    if (!paqueteId) return alert("⚠️ Ingresa un ID válido");

    try {
      const fecha = obtenerFechaHoraLocal();
      await registrarRecoleccionPaquete(paqueteId, fecha, TARIFA_PAQUETERIA);

      logger.info(
        LogCategory.PAQUETERIA,
        `✅ Paquete recolectado exitosamente`,
        {
          paqueteId,
          fecha,
          monto: TARIFA_PAQUETERIA,
          usuario: user?.name || 'Sin sesión'
        }
      );

      // Mostrar alerta de éxito
      alert(`✅ ¡RECOLECCIÓN REGISTRADA EXITOSAMENTE!\n\n📦 Detalles:\n• Paquete ID: #${paqueteId}\n• Monto Cobrado: $${TARIFA_PAQUETERIA.toFixed(2)}\n• Fecha: ${fecha}\n\n¡Gracias!`);
      
      setSuccessMessage('✅ Recolección registrada correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      setPaqueteId(null);
      
      // Recargar la lista de paquetes pendientes
      cargarPaquetesPendientes();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      
      logger.error(
        LogCategory.PAQUETERIA,
        `❌ Error al registrar recolección de paquete: ${errorMsg}`,
        { paqueteId, usuario: user?.name },
        error instanceof Error ? error : undefined
      );

      console.error('Error al recolectar paquete:', error);
      alert(`❌ Error al registrar la recolección: ${errorMsg}`);
    }
  };

  const handleCobrarPaquete = async (id: number) => {
    try {
      const fecha = obtenerFechaHoraLocal();
      await registrarRecoleccionPaquete(id, fecha, TARIFA_PAQUETERIA);

      logger.info(
        LogCategory.PAQUETERIA,
        `✅ Paquete cobrado desde lista pendientes`,
        {
          paqueteId: id,
          fecha,
          monto: TARIFA_PAQUETERIA,
          usuario: user?.name || 'Sin sesión'
        }
      );
      
      // Mostrar alerta de éxito
      alert(`✅ ¡PAQUETE COBRADO EXITOSAMENTE!\n\n📦 Detalles:\n• Paquete ID: #${id}\n• Monto Cobrado: $${TARIFA_PAQUETERIA.toFixed(2)}\n• Fecha: ${fecha}\n\n¡Gracias!`);
      
      setSuccessMessage('✅ Paquete cobrado correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Recargar la lista de paquetes pendientes
      cargarPaquetesPendientes();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      
      logger.error(
        LogCategory.PAQUETERIA,
        `❌ Error al cobrar paquete: ${errorMsg}`,
        { paqueteId: id, usuario: user?.name },
        error instanceof Error ? error : undefined
      );

      console.error('Error al cobrar paquete:', error);
      alert(`❌ Error al cobrar el paquete: ${errorMsg}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 lg:p-8">
      {/* Encabezado */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-600 p-3 rounded-lg">
            <FaBox className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">Gestión de Paquetería</h1>
            <p className="text-gray-600 text-sm mt-1">Registra entregas y cobros de paquetes</p>
          </div>
        </div>
      </div>

      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-slideDown">
          <FaCheck className="text-green-600 text-lg" />
          <p className="text-green-700 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Contenedor principal con dos columnas */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        
        {/* Card de registro de paquete */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FaPlus className="text-lg" />
              Registrar Paquete
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded">
              <p className="text-sm text-blue-800"><span className="font-semibold">📦 Función:</span> Registra un nuevo paquete en el sistema</p>
              <p className="text-sm text-blue-800 mt-2"><span className="font-semibold">🖨️ Resultado:</span> Se generarán tickets automáticamente</p>
            </div>

            <button
              onClick={handleGuardarPaquete}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"
            >
              <FaPlus className="text-lg" />
              Guardar Paquete Nuevo
            </button>
          </div>
        </div>

        {/* Card de recolección de paquete */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FaQrcode className="text-lg" />
              Recolectar Paquete
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ID del Paquete (Lectura QR)</label>
              <input
                type="number"
                value={paqueteId || ""}
                onChange={(e) => setPaqueteId(Number(e.target.value) || null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && paqueteId) {
                    handleRecolectarPaquete();
                  }
                }}
                placeholder="Escanea o ingresa el ID..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none transition-colors bg-gray-50"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                💡 Presiona Enter para registrar rápidamente
              </p>
            </div>

            <button
              onClick={handleRecolectarPaquete}
              disabled={!paqueteId}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"
            >
              <FaCheck className="text-lg" />
              Registrar Recolección
            </button>
          </div>
        </div>

        {/* Card de estadísticas */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FaDollarSign className="text-lg" />
              Información
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-orange-50 border-l-4 border-orange-600 rounded">
                <p className="text-sm text-gray-700"><span className="font-semibold">Tarifa por Paquete:</span></p>
                <p className="text-2xl font-bold text-orange-600">${TARIFA_PAQUETERIA.toFixed(2)}</p>
              </div>

              <div className="p-3 bg-gray-50 border-l-4 border-gray-600 rounded">
                <p className="text-sm text-gray-700"><span className="font-semibold">Paquetes Pendientes:</span></p>
                <p className="text-2xl font-bold text-gray-800">{paquetesPendientes.length}</p>
              </div>

              <div className="p-3 bg-green-50 border-l-4 border-green-600 rounded">
                <p className="text-sm text-gray-700"><span className="font-semibold">Ingresos Potenciales:</span></p>
                <p className="text-2xl font-bold text-green-600">${(paquetesPendientes.length * TARIFA_PAQUETERIA).toFixed(2)}</p>
              </div>
            </div>

            {user?.role === 'admin' ? (
              <div className="p-2 bg-blue-100 text-blue-700 rounded text-sm text-center font-semibold">
                📊 Vista General (Todos los usuarios)
              </div>
            ) : (
              <div className="p-2 bg-gray-100 text-gray-700 rounded text-sm text-center font-semibold">
                👤 Mis Paquetes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de paquetes pendientes */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaBox className="text-lg" />
            Paquetes Pendientes de Cobro
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin">
              <FaBox className="text-4xl text-blue-600" />
            </div>
          </div>
        ) : paquetesPendientes.length === 0 ? (
          <div className="p-12 text-center">
            <FaBox className="text-5xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay paquetes pendientes</p>
            <p className="text-gray-400 text-sm">Todos los paquetes han sido cobrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
                  <th className="py-4 px-6 text-left text-sm font-bold text-gray-700">ID Paquete</th>
                  <th className="py-4 px-6 text-left text-sm font-bold text-gray-700">Fecha Entrega</th>
                  <th className="py-4 px-6 text-left text-sm font-bold text-gray-700 flex items-center gap-2">
                    <FaClock className="text-orange-600" />
                    Tiempo Transcurrido
                  </th>
                  <th className="py-4 px-6 text-left text-sm font-bold text-gray-700">Monto</th>
                  {user?.role === 'admin' && (
                    <th className="py-4 px-6 text-left text-sm font-bold text-gray-700">Usuario</th>
                  )}
                  <th className="py-4 px-6 text-center text-sm font-bold text-gray-700">Acción</th>
                </tr>
              </thead>
              <tbody>
                {paquetesPendientes.map((paquete, index) => (
                  <tr
                    key={paquete.id}
                    className={`border-b transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-orange-50`}
                  >
                    <td className="py-4 px-6 text-sm font-semibold text-gray-800">#{paquete.id}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">
                      {new Date(paquete.fecha_entrega).toLocaleString('es-MX')}
                    </td>
                    <td className="py-4 px-6 text-sm font-semibold text-orange-600">
                      {calcularTiempoTranscurrido(paquete.fecha_entrega)}
                    </td>
                    <td className="py-4 px-6 text-sm font-bold text-green-600">
                      ${TARIFA_PAQUETERIA.toFixed(2)}
                    </td>
                    {user?.role === 'admin' && (
                      <td className="py-4 px-6 text-sm text-gray-700">{paquete.usuario_nombre}</td>
                    )}
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleCobrarPaquete(paquete.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-semibold text-sm transform hover:scale-105"
                      >
                        <FaCheck className="text-sm" />
                        Cobrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {paquetesPendientes.length > 0 && (
          <div className="p-6 bg-gray-50 border-t border-gray-200 text-right text-sm text-gray-600">
            Mostrando <span className="font-bold text-gray-800">{paquetesPendientes.length}</span> paquete(s) pendiente(s)
          </div>
        )}
      </div>
    </div>
  );
}
