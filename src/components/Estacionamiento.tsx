import { useState, useEffect, useRef } from "react";
import {
  registrarPago,
  registrarTicketEstacionamiento,
  registrarSalidaTicketEstacionamiento,
  consultaFechaEntradaTicket,
  obtenerTicket,
} from "../lib/db";
import createPdf from "../lib/CreateTicket";

import { FaExclamationTriangle } from "react-icons/fa";

import { TARIFA_ESTACIONAMIENTO_POR_HORA } from "../lib/Constantes";

export default function Estacionamiento() {
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [placas, setPlacas] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string | null>(null);
  const [fee, setFee] = useState<number | null>(null);
  const [generando, setGenerando] = useState(false);
  const [idTicket, setIdTicket] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

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
      await createPdf({ id, placasFormatted }, "print");
      alert(`Ticket generado e impreso. ID: ${id}`);
    } catch (error) {
      console.error("Error al generar ticket:", error);
      alert("Ocurrió un error al generar el ticket.");
    } finally {
      setGenerando(false);
      setPlacas(null);
    }
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
    </div>
  );
}
