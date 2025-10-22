import { useState, useEffect, useRef } from "react";
import {
  registrarPago,
  registrarTicketEstacionamiento,
  registrarSalidaTicketEstacionamiento,
  consultaFechaEntradaTicket,
  obtenerTicket,
  obtenerTicketsPendientesPorUsuario,
} from "../lib/db";
import {createTicketEstacionamiento} from "../lib/CreateTicket";

import { FaExclamationTriangle, FaCar, FaClock } from "react-icons/fa";

import { TARIFA_ESTACIONAMIENTO_POR_HORA } from "../lib/Constantes";
import { useAuth } from "../contexts/AuthContext";

export default function Estacionamiento() {
  const { user } = useAuth();
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [placas, setPlacas] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string | null>(null);
  const [fee, setFee] = useState<number | null>(null);
  const [generando, setGenerando] = useState(false);
  const [idTicket, setIdTicket] = useState<number | null>(null);
  const [ticketsPendientes, setTicketsPendientes] = useState<any[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar tickets pendientes al montar el componente
  useEffect(() => {
    cargarTicketsPendientes();
  }, []);

  const cargarTicketsPendientes = async () => {
    try {
      const tickets = await obtenerTicketsPendientesPorUsuario();
      setTicketsPendientes(tickets);
    } catch (error) {
      console.error("Error al cargar tickets pendientes:", error);
    }
  };

  useEffect(() => {
    const handleScannerInput = (e: KeyboardEvent) => {
      console.log("Key pressed:", e.key);
      
      if (e.key === "Enter") {
        const value = inputRef.current?.value;
        if (value && !isNaN(Number(value))) {
          checkTicket(Number(value));
          if (inputRef.current) inputRef.current.value = "";
        }
      }
    };

    window.addEventListener("keydown", handleScannerInput);

    return () => {
      window.removeEventListener("keydown", handleScannerInput);
    };
  }, []); 

  const handleGenerarTicket = async () => {
    if (!placas) {
      alert("Por favor, ingrese las placas del vehículo.");
      return;
    }

    setGenerando(true);
    try {
      const fecha = new Date();
      const id = await registrarTicketEstacionamiento(fecha.toISOString(), placas);
      const placasFormatted = placas.toUpperCase();
      await createTicketEstacionamiento({ id, placasFormatted }, "print");
      alert(`Ticket generado e impreso. ID: ${id}`);
      // Recargar lista de tickets pendientes
      await cargarTicketsPendientes();
    } catch (error) {
      console.error("Error al generar ticket:", error);
      alert("Ocurrió un error al generar el ticket.");
    } finally {
      setGenerando(false);
      setPlacas(null);
    }
  };

  const calcularTiempoTranscurrido = (fechaEntrada: string): string => {
    const startTime = new Date(fechaEntrada);
    const endTime = new Date();
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    return `${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  };

  const calcularMonto = (fechaEntrada: string): number => {
    const startTime = new Date(fechaEntrada);
    const endTime = new Date();
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    return diffHours * TARIFA_ESTACIONAMIENTO_POR_HORA;
  };

  const checkTicket = async (id: number) => {
    const ticket = await obtenerTicket(id);

    if (!ticket) {
      alert("❌ Ticket no encontrado.");
      setElapsedTime(null);
      setFee(null);
      setIdTicket(null);
      return;
    }

    if (ticket.total !== null) {
      alert("⚠️ Este ticket ya fue cobrado previamente.");
      setElapsedTime(null);
      setFee(null);
      setIdTicket(null);
      return;
    }

    const fecha_entrada = await consultaFechaEntradaTicket(id);
    const startTime = new Date(fecha_entrada);
    const endTime = new Date();
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

    const ratePerHour = TARIFA_ESTACIONAMIENTO_POR_HORA; // Example rate
    const totalFee = diffHours * ratePerHour;

    await registrarSalidaTicketEstacionamiento(id, endTime.toISOString());

    setElapsedTime(`${diffHours} horas`);
    setFee(totalFee);
    setIdTicket(id);
  };

  function SummaryCard({
    icon,
    bgColor,
    title,
    value1,
    subtitle,
    value2,
    subtitle2,
    value3,
    actionLabel,
    onAction,
  }: any) {
    return (
      <div className="dashboard-card bg-white p-6 shadow-md rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`rounded-full ${bgColor} p-3 mr-4`}>{icon}</div>
            <div>
              <h3 className="text-black text-xl">{title}</h3>
              <p className="text-2xl font-bold text-gray-800">{value1}</p>
              <p className="text-xl text-black flex items-center mt-2">
                <span>{subtitle}</span>
              </p>
              <p className="text-2xl font-bold text-gray-800">{value2}</p>
              <p className="text-xl text-black flex items-center mt-2">
                <span>{subtitle2}</span>
              </p>
              <p className="text-2xl font-bold text-gray-800">{value3}</p>
            </div>
          </div>
          {onAction && (
            <button
              onClick={onAction}
              className="ml-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              {actionLabel || "Confirmar"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Estacionamiento</h2>

      <div className="mt-6 grid grid-cols-3 md:grid-cols-3 gap-4">
        <div>
          <label className="text-gray-700 mb-2">Placas</label>
          <input
            type="text"
            onChange={(e) => setPlacas(e.target.value)}
            className="border px-4 py-2 rounded w-full mb-4"
          />
        </div>
      </div>
      <button
        onClick={handleGenerarTicket}
        disabled={generando}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {generando ? "Generando..." : "Generar"}
      </button>

      <div className="mt-6 ">
        
        <label className="block text-gray-700 mb-2">ID del Ticket</label>

      
        <input
          ref={inputRef}
          type="text"
          value={ticketId ?? ""}
          onChange={(e) => setTicketId(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && ticketId) {
              checkTicket(ticketId);
              setTicketId(null); // limpia después
            }
          }}
          className="border px-4 py-2 rounded w-full mb-4"
        />
        
        <button
          onClick={() => ticketId && checkTicket(ticketId)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Revisar Ticket
        </button>
      </div>

      {elapsedTime && fee !== null && (
        <div className="mt-6">
          {idTicket !== null && fee !== null && (
            <SummaryCard
              icon={<FaExclamationTriangle className="text-red-600 text-2xl" />}
              bgColor="bg-red-100"
              title="Tiempo transcurrido : "
              value1={elapsedTime}
              subtitle="Total a pagar: "
              value2={`$${fee}`}
              subtitle2="ID del Ticket: "
              value3={idTicket.toString()}
              actionLabel="Registrar pago"
              onAction={async () => {
                if (idTicket !== null && fee !== null) {
                  try {
                    await registrarPago(idTicket, fee); // función que guardarás en la BD
                    alert("✅ Pago registrado con éxito");
                    setElapsedTime(null);
                    setFee(null);
                    setIdTicket(null);
                    // Recargar lista de tickets pendientes
                    await cargarTicketsPendientes();
                  } catch (err) {
                    console.error(err);
                    alert("❌ Error al registrar pago");
                  }
                } else {
                  alert("ID de ticket o monto no válido.");
                }
              }}
            />
          )}
        </div>
      )}

      {/* Sección de Tickets Pendientes */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <FaCar className="mr-2 text-blue-600" />
            Vehículos con Ticket Pendiente de Pago
          </h3>
          {user?.role === 'admin' ? (
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm">
              📊 Vista General (Todos los usuarios)
            </span>
          ) : (
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">
              👤 Mis Tickets
            </span>
          )}
        </div>

        {ticketsPendientes.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
            ✅ No hay tickets pendientes de pago
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    ID Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Placas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Entrada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <FaClock className="inline mr-1" />
                    Tiempo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Monto Estimado
                  </th>
                  {user?.role === 'admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Registrado por
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ticketsPendientes.map((ticket) => {
                  const tiempoTranscurrido = calcularTiempoTranscurrido(ticket.fecha_entrada);
                  const montoEstimado = calcularMonto(ticket.fecha_entrada);
                  
                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{ticket.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {ticket.placas}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(ticket.fecha_entrada).toLocaleString('es-MX')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-semibold">
                        {tiempoTranscurrido}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
                        ${montoEstimado.toFixed(2)}
                      </td>
                      {user?.role === 'admin' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {ticket.usuario_nombre || 'N/A'}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => checkTicket(ticket.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                        >
                          Cobrar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
