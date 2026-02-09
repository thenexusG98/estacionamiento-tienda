import { useState, useEffect } from 'react';
import { registrarBaño, obtenerCostoServicio } from '../lib/db';
import { FaToilet, FaDollarSign, FaCheck, FaPlus, FaChartLine } from 'react-icons/fa';
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
    }
  };
  const [successMessage, setSuccessMessage] = useState('');
  const [registrosHoy, setRegistrosHoy] = useState(0);
  const [loading, setLoading] = useState(false);

  const registrarUsoBaño = async () => {
    setLoading(true);
    try {
      const fechaHora = obtenerFechaLocal();
      await registrarBaño(fechaHora, montoFijo);
      
      // Incrementar contador
      setRegistrosHoy(prev => prev + 1);
      
      // Mostrar alerta detallada
      alert(`✅ ¡USO DE BAÑO REGISTRADO EXITOSAMENTE!\n\n🚻 Detalles:\n• Monto Cobrado: $${montoFijo.toFixed(2)}\n• Fecha: ${fechaHora}\n• Registros hoy: ${registrosHoy + 1}\n\n¡Gracias!`);
      
      // Mostrar mensaje de éxito
      setSuccessMessage('✅ Uso del baño registrado correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error al registrar uso del baño:', error);
      alert('❌ Error al registrar el uso del baño. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 lg:p-8">
      {/* Encabezado */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-600 p-3 rounded-lg">
            <FaToilet className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">Gestión de Baños</h1>
            <p className="text-gray-600 text-sm mt-1">Registra el uso de los sanitarios</p>
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

      {/* Contenedor principal */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Card principal - Registro */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FaPlus className="text-lg" />
              Registrar Uso
            </h2>
          </div>

          <div className="p-8 lg:p-12">
            <div className="max-w-md mx-auto text-center space-y-6">
              {/* Icono grande */}
              <div className="flex justify-center">
                <div className="bg-blue-100 p-8 rounded-full">
                  <FaToilet className="text-6xl text-blue-600" />
                </div>
              </div>

              {/* Información */}
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-800">Uso de Sanitarios</h3>
                <p className="text-gray-600">Registra cada uso del baño con un solo clic</p>
              </div>

              {/* Monto */}
              <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-200">
                <p className="text-sm text-gray-600 font-semibold mb-2">Tarifa por Uso</p>
                <div className="flex items-center justify-center gap-2">
                  <FaDollarSign className="text-3xl text-green-600" />
                  <p className="text-5xl font-bold text-green-600">{montoFijo.toFixed(2)}</p>
                </div>
              </div>

              {/* Botón de registro */}
              <button
                onClick={registrarUsoBaño}
                disabled={loading}
                className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 transition-all transform shadow-lg ${
                  loading
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:scale-105'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin">
                      <FaToilet />
                    </div>
                    Registrando...
                  </>
                ) : (
                  <>
                    <FaPlus className="text-xl" />
                    Registrar Uso del Baño
                  </>
                )}
              </button>

              {/* Información adicional */}
              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded text-left">
                <p className="text-sm text-yellow-800">
                  💡 <span className="font-semibold">Tip:</span> El registro se guarda automáticamente en la base de datos con fecha y hora exacta.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card lateral - Estadísticas */}
        <div className="space-y-6">
          {/* Card de registros hoy */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaChartLine className="text-lg" />
                Estadísticas
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-purple-50 border-l-4 border-purple-600 rounded">
                <p className="text-sm text-gray-700 font-semibold mb-1">Registros en esta sesión</p>
                <p className="text-4xl font-bold text-purple-600">{registrosHoy}</p>
              </div>

              <div className="p-4 bg-green-50 border-l-4 border-green-600 rounded">
                <p className="text-sm text-gray-700 font-semibold mb-1">Ingreso en esta sesión</p>
                <p className="text-3xl font-bold text-green-600">
                  ${(registrosHoy * montoFijo).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Card de información */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaDollarSign className="text-lg" />
                Información
              </h2>
            </div>

            <div className="p-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded">
                  <FaCheck className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Registro Rápido</p>
                  <p className="text-xs text-gray-600">Solo un clic para registrar</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-2 rounded">
                  <FaDollarSign className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Tarifa Fija</p>
                  <p className="text-xs text-gray-600">Monto estándar por uso</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded">
                  <FaChartLine className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Control Automático</p>
                  <p className="text-xs text-gray-600">Registro con fecha y hora</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

