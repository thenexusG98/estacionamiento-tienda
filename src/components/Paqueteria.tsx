import { useState } from "react";
import { registrarEntregaPaquete, registrarRecoleccionPaquete } from "../lib/db";
import { createPdfPaqueteria } from "../lib/CreateTicket";
import { TARIFA_PAQUETERIA } from "../lib/Constantes";

export default function Paqueteria() {
  const [paqueteId, setPaqueteId] = useState<number | null>(null);

  const handleGuardarPaquete = async () => {
    const now = new Date();
    const fechas = now.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const hora = now.toTimeString().slice(0, 8); // "HH:MM:SS"
    const fecha = `${fechas} ${hora}`;
    
    const id = await registrarEntregaPaquete(fecha);

    // Imprimir 2 tickets
    await createPdfPaqueteria({id});

    alert(`✅ Paquete registrado. Ticket ID: ${id}`);
  };

  const handleRecolectarPaquete = async () => {
    if (!paqueteId) return alert("Ingresa un ID válido");

    const now = new Date();
    const fechas = now.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const hora = now.toTimeString().slice(0, 8); // "HH:MM:SS"
    const fecha = `${fechas} ${hora}`;
    
    await registrarRecoleccionPaquete(paqueteId, fecha, TARIFA_PAQUETERIA);

    alert("✅ Recolección registrada correctamente");
    setPaqueteId(null);
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

      <div>
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
    </div>
  );
}
