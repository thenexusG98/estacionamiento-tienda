/**
 * ConfigImpresora.tsx
 * Panel de configuración y prueba de comunicación para la impresora POS-5890U (USB raw)
 * La impresora se comunica via puerto USB de Windows: USB001, USB002, etc.
 */
import { useState, useCallback } from 'react';
import {
  connectPrinter,
  disconnectPrinter,
  isPrinterConnected,
  getPrinterPort,
  printerTestPage,
  printerLine,
  printerSeparator,
  printerCut,
} from '../lib/ThermalPrinter';
import {
  FaPrint,
  FaPlug,
  FaUnlink,
  FaCheckCircle,
  FaTimesCircle,
  FaSync,
  FaUsb,
} from 'react-icons/fa';

type LogEntry = { type: 'ok' | 'error' | 'info'; text: string; ts: string };

const COMMON_PORTS = ['USB001', 'USB002', 'USB003', 'LPT1'];

function logTs(): string {
  return new Date().toLocaleTimeString('es-MX');
}

export default function ConfigImpresora() {
  const [connected, setConnected]   = useState(isPrinterConnected());
  const [loading, setLoading]       = useState(false);
  const [logs, setLogs]             = useState<LogEntry[]>([]);
  const [customText, setCustomText] = useState('');
  const [portName, setPortName]     = useState(getPrinterPort() ?? 'USB001');

  const addLog = useCallback((type: LogEntry['type'], text: string) => {
    setLogs((prev) => [{ type, text, ts: logTs() }, ...prev].slice(0, 100));
  }, []);

  // ── Conectar ──────────────────────────────────────────────────────────────
  const handleConnect = async () => {
    setLoading(true);
    addLog('info', `Intentando conectar al puerto ${portName}…`);
    const result = await connectPrinter(portName);
    if (result.ok) {
      setConnected(true);
      addLog('ok', result.message);
    } else {
      setConnected(false);
      addLog('error', result.message);
    }
    setLoading(false);
  };

  // ── Desconectar ───────────────────────────────────────────────────────────
  const handleDisconnect = async () => {
    setLoading(true);
    await disconnectPrinter();
    setConnected(false);
    addLog('info', 'Impresora desconectada.');
    setLoading(false);
  };

  // ── Página de prueba ──────────────────────────────────────────────────────
  const handleTestPage = async () => {
    setLoading(true);
    addLog('info', 'Enviando página de prueba…');
    const result = await printerTestPage();
    addLog(result.ok ? 'ok' : 'error', result.message);
    setLoading(false);
  };

  // ── Texto personalizado ───────────────────────────────────────────────────
  const handlePrintCustom = async () => {
    if (!customText.trim()) return;
    setLoading(true);
    addLog('info', `Imprimiendo texto: "${customText}"`);
    try {
      await printerLine(customText, { align: 'center' });
      await printerSeparator('-', 32);
      await printerCut(true);
      addLog('ok', 'Texto enviado correctamente.');
    } catch (err: any) {
      addLog('error', `Error: ${err?.message ?? err}`);
    }
    setLoading(false);
  };

  // ── Pulso ACK (secuencia mínima) ─────────────────────────────────────────
  const handlePing = async () => {
    setLoading(true);
    addLog('info', 'Enviando pulso de inicialización (ESC @)…');
    try {
      await printerLine('PING OK', { align: 'center', bold: true });
      await printerCut(true);
      addLog('ok', 'Pulso ESC @ enviado. Impresora respondió.');
    } catch (err: any) {
      addLog('error', `Sin respuesta: ${err?.message ?? err}`);
    }
    setLoading(false);
  };

  // ── Indicador de estado ───────────────────────────────────────────────────
  const StatusBadge = () =>
    connected ? (
      <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-3 py-1 rounded-full text-sm font-semibold">
        <FaCheckCircle /> Conectada
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-3 py-1 rounded-full text-sm font-semibold">
        <FaTimesCircle /> Desconectada
      </span>
    );

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaPrint className="text-blue-600" />
            Configuración de Impresora
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            POS-5890U — Puerto USB directo (USB001, USB002…)
          </p>
        </div>
        <StatusBadge />
      </div>

      {/* ── Selección de puerto USB ──────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow p-5 space-y-4">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <FaUsb /> Puerto USB de la impresora
        </h3>
        <p className="text-xs text-gray-500">
          Ingresa el nombre exacto del puerto como aparece en <strong>Propiedades de la impresora → Puerto</strong>.
          Normalmente es <strong>USB001</strong> o <strong>USB002</strong>.
        </p>

        <div className="flex flex-wrap gap-3 items-end">
          <label className="flex flex-col text-sm text-gray-600 flex-1 min-w-[160px]">
            Nombre del puerto
            <input
              type="text"
              value={portName}
              onChange={(e) => setPortName(e.target.value.toUpperCase())}
              placeholder="ej: USB001"
              className="mt-1 border rounded px-3 py-2 text-gray-800 font-mono uppercase"
              disabled={connected}
            />
          </label>

          <div className="flex gap-2 flex-wrap">
            {COMMON_PORTS.map((p) => (
              <button
                key={p}
                onClick={() => setPortName(p)}
                disabled={connected}
                className={`px-3 py-1 rounded text-xs border font-mono ${
                  portName === p
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                } disabled:opacity-40`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Para verificarlo: Panel de control → Dispositivos e impresoras → clic derecho en POS-5890U → Propiedades de la impresora → pestaña Puertos.
        </p>
      </section>

      {/* ── Acciones de conexión ─────────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Control de conexión</h3>
        <div className="flex flex-wrap gap-3">
          <button
            disabled={loading || connected || !portName.trim()}
            onClick={handleConnect}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPlug />
            {loading && !connected ? 'Conectando…' : `Conectar a ${portName || '…'}`}
          </button>

          <button
            disabled={loading || !connected}
            onClick={handleDisconnect}
            className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaUnlink />
            Desconectar
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Al conectar se envía un comando ESC @ al puerto indicado para verificar
          que la impresora responde. Si el puerto es incorrecto aparecerá un error en el registro.
        </p>
      </section>

      {/* ── Pruebas de comunicación ──────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow p-5 space-y-4">
        <h3 className="font-semibold text-gray-700">Pruebas de comunicación</h3>

        {/* Página de prueba completa */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <button
            disabled={loading || !connected}
            onClick={handleTestPage}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPrint />
            Imprimir página de prueba
          </button>
          <span className="text-xs text-gray-500">
            Imprime texto de muestra con diferentes estilos y corta el papel.
          </span>
        </div>

        {/* Pulso de inicialización */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <button
            disabled={loading || !connected}
            onClick={handlePing}
            className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSync />
            Ping ESC @
          </button>
          <span className="text-xs text-gray-500">
            Envía un reset ESC @ + "PING OK" para verificar que la comunicación funciona.
          </span>
        </div>

        {/* Texto personalizado */}
        <div className="space-y-2">
          <label className="text-sm text-gray-600 font-medium block">
            Imprimir texto personalizado
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Escribe cualquier texto…"
              className="flex-1 border rounded px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handlePrintCustom()}
            />
            <button
              disabled={loading || !connected || !customText.trim()}
              onClick={handlePrintCustom}
              className="flex items-center gap-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <FaPrint /> Enviar
            </button>
          </div>
        </div>
      </section>

      {/* ── Consola de logs ──────────────────────────────────────────────── */}
      <section className="bg-gray-900 rounded-xl shadow p-4 space-y-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-gray-300">Registro de actividad</h3>
          <button
            onClick={() => setLogs([])}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            Limpiar
          </button>
        </div>
        <div className="h-48 overflow-y-auto space-y-1 font-mono text-xs">
          {logs.length === 0 && (
            <p className="text-gray-600 italic">Sin actividad aún…</p>
          )}
          {logs.map((entry, i) => (
            <div
              key={i}
              className={`flex gap-2 ${
                entry.type === 'ok'
                  ? 'text-green-400'
                  : entry.type === 'error'
                  ? 'text-red-400'
                  : 'text-gray-400'
              }`}
            >
              <span className="text-gray-600 select-none">[{entry.ts}]</span>
              <span>
                {entry.type === 'ok' ? '✔' : entry.type === 'error' ? '✖' : 'ℹ'}{' '}
                {entry.text}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Info técnica ─────────────────────────────────────────────────── */}
      <section className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-1">
        <p className="font-semibold">Información técnica — POS-5890U</p>
        <ul className="list-disc list-inside space-y-0.5 text-xs text-blue-700">
          <li>Protocolo: ESC/POS (Epson compatible)</li>
          <li>Interfaz: USB Raw — los bytes se escriben directamente al dispositivo <code>\\\\.\\USB001</code></li>
          <li>Ancho de papel: 58 mm (~32 caracteres fuente normal)</li>
          <li>Sin diálogos de impresión: los datos van directo a la impresora</li>
          <li>Todo el ticket se envía en un solo bloque al cortar el papel</li>
          <li>ESC @ al inicio de cada trabajo garantiza posición al primer carácter</li>
        </ul>
      </section>
    </div>
  );
}
