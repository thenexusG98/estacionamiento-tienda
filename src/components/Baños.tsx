import { registrarBaño } from '../lib/db';
import { TARIFA_BAÑO} from '../lib/Constantes';

// Función helper para obtener fecha local
function obtenerFechaLocal(): string {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

export default function Baños() {
  const montoFijo = TARIFA_BAÑO; // Monto fijo para el uso del baño

  const registrarUsoBaño = async () => {
    const fechaHora = obtenerFechaLocal();
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

