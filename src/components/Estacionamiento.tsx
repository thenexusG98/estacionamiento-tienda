import { useState, useEffect, useRef } from "react";
import {
  registrarPago,
  registrarTicketEstacionamiento,
  registrarSalidaTicketEstacionamiento,
  consultaFechaEntradaTicket,
  obtenerTicket,
  obtenerTicketsPendientesPorUsuario,
} from "../lib/db";
import { createTicketEstacionamiento } from "../lib/CreateTicket";
import { FaCar, FaClock, FaQrcode, FaPlus, FaDollarSign, FaCheck, FaParking } from "react-icons/fa";
import { TARIFA_ESTACIONAMIENTO_POR_HORA } from "../lib/Constantes";
import { useAuth } from "../contexts/AuthContext";

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

export default function Estacionamiento() {
  const { user } = useAuth();
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [placas, setPlacas] = useState<string>("");
  const [elapsedTime, setElapsedTime] = useState<string | null>(null);
  const [fee, setFee] = useState<number | null>(null);
  const [generando, setGenerando] = useState(false);
  const [idTicket, setIdTicket] = useState<number | null>(null);
  const [ticketsPendientes, setTicketsPendientes] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar tickets pendientes al montar el componente
  useEffect(() => {
    cargarTicketsPendientes();
  }, []);

  const cargarTicketsPendientes = async () => {
    setLoading(true);
    try {
      const tickets = await obtenerTicketsPendientesPorUsuario();
      setTicketsPendientes(tickets);
    } catch (error) {
      console.error("Error al cargar tickets pendientes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleScannerInput = (e: KeyboardEvent) => {
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
    if (!placas || !placas.trim()) {
      alert("⚠️ Por favor, ingrese las placas del vehículo.");
      return;
    }

    setGenerando(true);
    try {
      const fecha = obtenerFechaHoraLocal();
      const id = await registrarTicketEstacionamiento(fecha, placas);

      if (!id || id === 0) {
        throw new Error('No se pudo generar el ID del ticket');
      }

      const placasFormatted = placas.toUpperCase();
      await createTicketEstacionamiento({ id, placasFormatted }, "print");
      
      // Alerta detallada de éxito
      alert(`✅ ¡TICKET DE ESTACIONAMIENTO GENERADO!\n\n🚗 Detalles:\n• Ticket ID: #${id}\n• Placas: ${placasFormatted}\n• Fecha Entrada: ${fecha}\n• Tarifa: $${TARIFA_ESTACIONAMIENTO_POR_HORA.toFixed(2)}/hora\n\n¡Ticket impreso exitosamente!`);
      
      setSuccessMessage('✅ Ticket generado e impreso correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      await cargarTicketsPendientes();
      setPlacas("");
    } catch (error) {
      console.error("Error al generar ticket:", error);
      alert(`❌ Error al generar el ticket: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setGenerando(false);
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

    const totalFee = diffHours * TARIFA_ESTACIONAMIENTO_POR_HORA;

    await registrarSalidaTicketEstacionamiento(id, obtenerFechaHoraLocal());

    setElapsedTime(`${diffHours} hora${diffHours !== 1 ? 's' : ''}`);
    setFee(totalFee);
    setIdTicket(id);
  };

  const handleRegistrarPago = async () => {
    if (idTicket !== null && fee !== null) {
      try {
        await registrarPago(idTicket, fee);
        
        // Alerta detallada de pago exitoso
        alert(`✅ ¡PAGO REGISTRADO EXITOSAMENTE!\n\n🚗 Detalles:\n• Ticket ID: #${idTicket}\n• Tiempo Estacionado: ${elapsedTime}\n• Monto Cobrado: $${fee.toFixed(2)}\n• Fecha: ${obtenerFechaHoraLocal()}\n\n¡Gracias por usar nuestro estacionamiento!`);
        
        setSuccessMessage('✅ Pago registrado correctamente');
        setTimeout(() => setSuccessMessage(''), 3000);
        
        setElapsedTime(null);
        setFee(null);
        setIdTicket(null);
        await cargarTicketsPendientes();
      } catch (err) {
        console.error(err);
        alert("❌ Error al registrar pago");
      }
    } else {
      alert("⚠️ ID de ticket o monto no válido.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 lg:p-8">
      {/* Encabezado */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-600 p-3 rounded-lg">
            <FaParking className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">Gestión de Estacionamiento</h1>
            <p className="text-gray-600 text-sm mt-1">Control de entradas y salidas de vehículos</p>
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

      {/* Contenedor principal con grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        
        {/* Card de generar ticket */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FaPlus className="text-lg" />
              Generar Ticket
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Placas del Vehículo</label>
              <input
                type="text"
                value={placas}
                onChange={(e) => setPlacas(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && placas.trim()) {
                    handleGenerarTicket();
                  }
                }}
                placeholder="ABC-123"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition-colors bg-gray-50 uppercase"
                maxLength={10}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">💡 Presiona Enter para generar rápidamente</p>
            </div>

            <div className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded">
              <p className="text-sm text-blue-800"><span className="font-semibold">Tarifa:</span> ${TARIFA_ESTACIONAMIENTO_POR_HORA.toFixed(2)} por hora</p>
              <p className="text-xs text-blue-700 mt-1">El cobro se calcula por hora completa</p>
            </div>

            <button
              onClick={handleGenerarTicket}
              disabled={generando || !placas.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"
            >
              {generando ? (
                <>
                  <div className="animate-spin">
                    <FaPlus />
                  </div>
                  Generando...
                </>
              ) : (
                <>
                  <FaPlus className="text-lg" />
                  Generar Ticket
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card de cobrar ticket */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FaQrcode className="text-lg" />
              Cobrar Ticket
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ID del Ticket (Escaneo QR)</label>
              <input
                ref={inputRef}
                type="number"
                value={ticketId ?? ""}
                onChange={(e) => setTicketId(Number(e.target.value) || null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && ticketId) {
                    checkTicket(ticketId);
                    setTicketId(null);
                  }
                }}
                placeholder="Escanea o ingresa el ID..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none transition-colors bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-2">💡 Escanea el código QR o ingresa el ID manualmente</p>
            </div>

            <button
              onClick={() => ticketId && checkTicket(ticketId)}
              disabled={!ticketId}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"
            >
              <FaQrcode className="text-lg" />
              Revisar Ticket
            </button>
          </div>
        </div>

        {/* Card de información/estadísticas */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FaDollarSign className="text-lg" />
              Información
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="p-3 bg-orange-50 border-l-4 border-orange-600 rounded">
              <p className="text-sm text-gray-700 font-semibold mb-1">Tarifa por Hora</p>
              <p className="text-3xl font-bold text-orange-600">${TARIFA_ESTACIONAMIENTO_POR_HORA.toFixed(2)}</p>
            </div>

            <div className="p-3 bg-gray-50 border-l-4 border-gray-600 rounded">
              <p className="text-sm text-gray-700 font-semibold mb-1">Tickets Pendientes</p>
              <p className="text-3xl font-bold text-gray-800">{ticketsPendientes.length}</p>
            </div>

            <div className="p-3 bg-green-50 border-l-4 border-green-600 rounded">
              <p className="text-sm text-gray-700 font-semibold mb-1">Total Estimado</p>
              <p className="text-2xl font-bold text-green-600">
                ${ticketsPendientes.reduce((sum, t) => sum + calcularMonto(t.fecha_entrada), 0).toFixed(2)}
              </p>
            </div>

            {user?.role === 'admin' ? (
              <div className="p-2 bg-blue-100 text-blue-700 rounded text-sm text-center font-semibold">
                📊 Vista General (Todos los usuarios)
              </div>
            ) : (
              <div className="p-2 bg-gray-100 text-gray-700 rounded text-sm text-center font-semibold">
                👤 Mis Tickets
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card de resumen de pago (cuando se revisa un ticket) */}
      {elapsedTime && fee !== null && idTicket !== null && (
        <div className="mb-8 bg-white rounded-2xl shadow-lg overflow-hidden border border-orange-200">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FaClock className="text-lg" />
              Resumen de Cobro
            </h2>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                <FaCar className="text-4xl text-blue-600 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-semibold mb-2">Ticket ID</p>
                <p className="text-3xl font-bold text-gray-800">#{idTicket}</p>
              </div>

              <div className="text-center p-6 bg-orange-50 rounded-xl border-2 border-orange-200">
                <FaClock className="text-4xl text-orange-600 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-semibold mb-2">Tiempo Estacionado</p>
                <p className="text-3xl font-bold text-orange-600">{elapsedTime}</p>
              </div>

              <div className="text-center p-6 bg-green-50 rounded-xl border-2 border-green-200">
                <FaDollarSign className="text-4xl text-green-600 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-semibold mb-2">Total a Pagar</p>
                <p className="text-4xl font-bold text-green-600">${fee.toFixed(2)}</p>
              </div>
            </div>

            <button
              onClick={handleRegistrarPago}
              className="w-full mt-6 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 shadow-lg"
            >
              <FaCheck className="text-xl" />
              Registrar Pago
            </button>
          </div>
        </div>
      )}

      {/* Tabla de tickets pendientes */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaCar className="text-lg" />
            Vehículos con Ticket Pendiente de Pago
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin">
              <FaCar className="text-4xl text-blue-600" />
            </div>
          </div>
        ) : ticketsPendientes.length === 0 ? (
          <div className="p-12 text-center">
            <FaCar className="text-5xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">✅ No hay tickets pendientes de pago</p>
            <p className="text-gray-400 text-sm">Todos los vehículos han sido cobrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
                  <th className="py-4 px-6 text-left text-sm font-bold text-gray-700">ID Ticket</th>
                  <th className="py-4 px-6 text-left text-sm font-bold text-gray-700">Placas</th>
                  <th className="py-4 px-6 text-left text-sm font-bold text-gray-700">Fecha Entrada</th>
                  <th className="py-4 px-6 text-left text-sm font-bold text-gray-700 flex items-center gap-2">
                    <FaClock className="text-orange-600" />
                    Tiempo
                  </th>
                  <th className="py-4 px-6 text-left text-sm font-bold text-gray-700">Monto Estimado</th>
                  {user?.role === 'admin' && (
                    <th className="py-4 px-6 text-left text-sm font-bold text-gray-700">Registrado por</th>
                  )}
                  <th className="py-4 px-6 text-center text-sm font-bold text-gray-700">Acción</th>
                </tr>
              </thead>
              <tbody>
                {ticketsPendientes.map((ticket, index) => {
                  const tiempoTranscurrido = calcularTiempoTranscurrido(ticket.fecha_entrada);
                  const montoEstimado = calcularMonto(ticket.fecha_entrada);

                  return (
                    <tr
                      key={ticket.id}
                      className={`border-b transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-purple-50`}
                    >
                      <td className="py-4 px-6 text-sm font-semibold text-gray-800">#{ticket.id}</td>
                      <td className="py-4 px-6 text-sm">
                        <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded">
                          {ticket.placas}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        {new Date(ticket.fecha_entrada).toLocaleString('es-MX')}
                      </td>
                      <td className="py-4 px-6 text-sm font-semibold text-orange-600">
                        {tiempoTranscurrido}
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-green-600">
                        ${montoEstimado.toFixed(2)}
                      </td>
                      {user?.role === 'admin' && (
                        <td className="py-4 px-6 text-sm text-gray-700">
                          {ticket.usuario_nombre || 'N/A'}
                        </td>
                      )}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => checkTicket(ticket.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-semibold text-sm transform hover:scale-105 mx-auto"
                        >
                          <FaDollarSign className="text-sm" />
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

        {/* Footer */}
        {ticketsPendientes.length > 0 && (
          <div className="p-6 bg-gray-50 border-t border-gray-200 text-right text-sm text-gray-600">
            Mostrando <span className="font-bold text-gray-800">{ticketsPendientes.length}</span> ticket(s) pendiente(s)
          </div>
        )}
      </div>
    </div>
  );
}
