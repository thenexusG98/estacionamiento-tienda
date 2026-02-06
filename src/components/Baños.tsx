import { useState, useEffect } from 'react';
import { registrarBaño, obtenerCostoServicio } from '../lib/db';
import { TARIFA_BAÑO } from '../lib/Constantes';

// Función helper para obtener fecha local
function obtenerFechaLocal(): string {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

export default function Baños() {
  const [montoFijo, setMontoFijo] = useState(TARIFA_BAÑO);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarCosto();
  }, []);

  const cargarCosto = async () => {
    try {
      const costo = await obtenerCostoServicio('baño', TARIFA_BAÑO);
      setMontoFijo(costo);
    } catch (error) {
      console.error('Error al cargar costo del baño:', error);
      setMontoFijo(TARIFA_BAÑO); // Usar valor por defecto en caso de error
    } finally {
      setCargando(false);
    }
  };

  const registrarUsoBaño = async () => {
    const fechaHora = obtenerFechaLocal();
    await registrarBaño(fechaHora, montoFijo);
    alert('Uso del baño registrado correctamente.');
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Baños</h2>

      <div className="mt-6">
        <p className="text-gray-700 mb-4">
          Monto: {cargando ? 'Cargando...' : `$${montoFijo}`}
        </p>
        <button
          onClick={registrarUsoBaño}
          disabled={cargando}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Registrar Uso del Baño
        </button>
      </div>
    </div>
  );
}

