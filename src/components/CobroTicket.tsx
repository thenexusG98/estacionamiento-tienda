import { useState } from 'react';
import { getDb } from '../lib/db';

export default function CobroTicket() {
  const [ticketId, setTicketId] = useState('');
  const [info, setInfo] = useState<{ tiempo: string; total: number } | null>(null);

  const buscarTicket = async () => {
    const db = await getDb();
    const [{ fecha_entrada } = {}] = await db.select<{ fecha_entrada: string }[]>(
      `SELECT fecha_entrada FROM tickets WHERE id = ? AND fecha_salida IS NULL`,
      [ticketId]
    );

    if (!fecha_entrada) {
      alert('Ticket no encontrado o ya cobrado.');
      return;
    }

    const entrada = new Date(fecha_entrada);
    const salida = new Date();
    const ms = salida.getTime() - entrada.getTime();
    const minutos = Math.ceil(ms / (1000 * 60));
    const total = Math.ceil(minutos / 30) * 10; // $10 cada 30 minutos

    setInfo({ tiempo: `${minutos} minutos`, total });
  };

  const registrarSalida = async () => {
    const db = await getDb();
    const fechaSalida = new Date().toISOString().slice(0, 10);
    await db.execute(
      `UPDATE tickets SET fecha_salida = ?, total = ? WHERE id = ?`,
      [fechaSalida, info?.total, ticketId]
    );
    alert('Pago registrado correctamente ✅');
    setTicketId('');
    setInfo(null);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Cobrar Ticket</h2>
      <input
        className="border px-4 py-2 rounded w-full md:w-1/3 mb-4"
        type="text"
        placeholder="Escanea o ingresa ID del ticket"
        value={ticketId}
        onChange={(e) => setTicketId(e.target.value)}
      />
      <div className="flex gap-4">
        <button
          onClick={buscarTicket}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          Buscar
        </button>
      </div>

      {info && (
        <div className="mt-6">
          <p className="text-lg">Tiempo: <strong>{info.tiempo}</strong></p>
          <p className="text-lg mb-4">Total a pagar: <strong>${info.total}</strong></p>
          <button
            onClick={registrarSalida}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Registrar salida y cobrar
          </button>
        </div>
      )}
    </div>
  );
}
