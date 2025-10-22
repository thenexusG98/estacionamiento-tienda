import { useState, useEffect } from "react";
import { registrarEntregaPaquete, registrarRecoleccionPaquete, obtenerPaquetesPendientesPorUsuario } from "../lib/db";
import { createPdfPaqueteria } from "../lib/CreateTicket";
import { TARIFA_PAQUETERIA } from "../lib/Constantes";
import { useAuth } from "../hooks/useAuth";
import { FaBox, FaClock } from "react-icons/fa";

export default function Paqueteria() {
  const [paqueteId, setPaqueteId] = useState<number | null>(null);
  const [paquetesPendientes, setPaquetesPendientes] = useState<{
    id: number;
    fecha_entrega: string;
    usuario_nombre: string;
  }[]>([]);
  const { user } = useAuth();

  // Cargar paquetes pendientes al montar el componente
  useEffect(() => {
    cargarPaquetesPendientes();
  }, []);

  const cargarPaquetesPendientes = async () => {
    const paquetes = await obtenerPaquetesPendientesPorUsuario();
    setPaquetesPendientes(paquetes);
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
    const fecha = new Date().toISOString();
    const id = await registrarEntregaPaquete(fecha);

    // Imprimir 2 tickets
    await createPdfPaqueteria({id});

    alert(`✅ Paquete registrado. Ticket ID: ${id}`);
    
    // Recargar la lista de paquetes pendientes
    cargarPaquetesPendientes();
  };

  const handleRecolectarPaquete = async () => {
    if (!paqueteId) return alert("Ingresa un ID válido");

    const fecha = new Date().toISOString();
    await registrarRecoleccionPaquete(paqueteId, fecha, TARIFA_PAQUETERIA);

    alert("✅ Recolección registrada correctamente");
    setPaqueteId(null);
    
    // Recargar la lista de paquetes pendientes
    cargarPaquetesPendientes();
  };

  const handleCobrarPaquete = async (id: number) => {
    const fecha = new Date().toISOString();
    await registrarRecoleccionPaquete(id, fecha, TARIFA_PAQUETERIA);
    
    alert("✅ Paquete cobrado correctamente");
    
    // Recargar la lista de paquetes pendientes
    cargarPaquetesPendientes();
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Módulo de Paquetería</h2>

      <button
        onClick={handleGuardarPaquete}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-6"
      >
        Guardar paquete
      </button>

      <div className="mb-6">
        <label>ID del paquete (lectura del ticket):</label>

        <input
          type="number"
          value={paqueteId || ""}
          onChange={(e) => setPaqueteId(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && paqueteId) {
                handleRecolectarPaquete();
                setPaqueteId(null); // limpia después
            }
          }}
          className="border px-3 py-2 rounded w-full mb-4"
        />
        <button
          onClick={handleRecolectarPaquete}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Registrar recolección
        </button>
      </div>

      {/* Sección de paquetes pendientes */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FaBox className="text-orange-600" />
            Paquetes Pendientes de Cobro
          </h3>
          {user?.role === 'admin' ? (
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm">
              📊 Vista General (Todos los usuarios)
            </span>
          ) : (
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">
              👤 Mis Paquetes
            </span>
          )}
        </div>

        {paquetesPendientes.length === 0 ? (
          <p className="text-gray-500 italic">No hay paquetes pendientes de cobro</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left border-b">ID</th>
                  <th className="px-4 py-2 text-left border-b">Fecha Entrega</th>
                  <th className="px-4 py-2 text-left border-b">
                    <FaClock className="inline mr-1" />
                    Tiempo Transcurrido
                  </th>
                  <th className="px-4 py-2 text-left border-b">Monto</th>
                  {user?.role === 'admin' && (
                    <th className="px-4 py-2 text-left border-b">Usuario</th>
                  )}
                  <th className="px-4 py-2 text-left border-b">Acción</th>
                </tr>
              </thead>
              <tbody>
                {paquetesPendientes.map((paquete) => (
                  <tr key={paquete.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-b">{paquete.id}</td>
                    <td className="px-4 py-2 border-b">
                      {new Date(paquete.fecha_entrega).toLocaleString('es-MX')}
                    </td>
                    <td className="px-4 py-2 border-b">
                      {calcularTiempoTranscurrido(paquete.fecha_entrega)}
                    </td>
                    <td className="px-4 py-2 border-b font-semibold text-green-700">
                      ${TARIFA_PAQUETERIA.toFixed(2)}
                    </td>
                    {user?.role === 'admin' && (
                      <td className="px-4 py-2 border-b">{paquete.usuario_nombre}</td>
                    )}
                    <td className="px-4 py-2 border-b">
                      <button
                        onClick={() => handleCobrarPaquete(paquete.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                      >
                        Cobrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
