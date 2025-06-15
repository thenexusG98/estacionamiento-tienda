import React from 'react';
import { registrarBaño } from '../lib/db';

export default function Baños() {
  const montoFijo = 5; // Monto fijo para el uso del baño

  const registrarUsoBaño = async () => {
    const fechaHora = new Date().toISOString().slice(0, 10);
    await registrarBaño(fechaHora, montoFijo);
    alert('Uso del baño registrado correctamente.');
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Baños</h2>

      <div className="mt-6">
        <p className="text-gray-700 mb-4">Monto fijo: ${montoFijo}</p>
        <button
          onClick={registrarUsoBaño}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Registrar Uso del Baño
        </button>
      </div>
    </div>
  );
}

