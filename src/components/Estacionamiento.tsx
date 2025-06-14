import { useState } from 'react'
import { getDb, registrarTicketEstacionamiento } from '../lib/db'
import createPdf  from '../lib/CreateTicket';


export default function Estacionamiento() {
  const [ticketId, setTicketId] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState<string | null>(null)
  const [fee, setFee] = useState<number | null>(null)
  const [generando, setGenerando] = useState(false);

  /*const generateTicket = async () => {
    const db = await getDb()

    const [{ id }] = await db.select<{ id: number }[]>(
      `SELECT last_insert_rowid() AS id`
    )

    setTicketId(id)
    alert(`Ticket generado con ID: ${id}`)
  }*/

  const handleGenerarTicket = async () => {
    
      setGenerando(true);
      try {
        const fecha = new Date().toISOString();
        const id = await registrarTicketEstacionamiento(fecha);

        const resultado = await createPdf({ id }, 'print');

        //await  imprimirTicketDesdeFrontend(id);
        
        alert(`Ticket generado e impreso. ID: ${id}`);

      } catch (error) {
        console.error('Error al generar ticket:', error);
        alert('Ocurrió un error al generar el ticket.');
      } finally {
        setGenerando(false);
      }
    };

  const checkTicket = async (id: number) => {
    const db = await getDb()
    const [{ fecha_hora }] = await db.select<{ fecha_hora: string }[]>(
      `SELECT fecha_hora FROM estacionamiento_tickets WHERE id = ?`,
      [id]
    )

    const startTime = new Date(fecha_hora)
    const endTime = new Date()
    const diffMs = endTime.getTime() - startTime.getTime()
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))

    const ratePerHour = 10 // Example rate
    const totalFee = diffHours * ratePerHour

    setElapsedTime(`${diffHours} horas`)
    setFee(totalFee)
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Estacionamiento</h2>

      <button
        onClick={handleGenerarTicket}
        disabled={generando}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
         {generando ? 'Generando...' : 'Generar'}
      </button>

      <div className="mt-6">
        <label className="block text-gray-700 mb-2">ID del Ticket</label>
        <input
          type="number"
          onChange={(e) => setTicketId(Number(e.target.value))}
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
          <p className="text-gray-700">Tiempo transcurrido: {elapsedTime}</p>
          <p className="text-gray-700">Tarifa: ${fee}</p>
        </div>
      )}
    </div>
  )
}
