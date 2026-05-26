/**
 * ConfigImpresora.tsx
 * Panel de configuración y prueba de comunicación para la impresora POS-5890U (USB/Serial)
 */
import { useState, useCallback } from 'react';
import {
  connectPrinter,
  disconnectPrinter,
  isPrinterConnected,
  printerTestPage,
  printerLine,
  printerSeparator,
  printerCut,
  DEFAULT_PORT_CONFIG,
  type PrinterPortConfig,
} from '../lib/ThermalPrinter';
import {
  FaPrint,
  FaPlug,
  FaUnlink,
  FaCheckCircle,
  FaTimesCircle,
  FaSync,
  FaSlidersH,
} from 'react-icons/fa';

type LogEntry = { type: 'ok' | 'error' | 'info'; text: string; ts: string };

const BAUD_RATES = [9600, 19200, 38400, 57600, 115200] as const;

function logTs(): string {
  return new Date().toLocaleTimeString('es-MX');
}

export default function ConfigImpresora() {
  const [connected, setConnected]   = useState(isPrinterConnected());
  const [loading, setLoading]       = useState(false);
  const [logs, setLogs]             = useState<LogEntry[]>([]);
  const [customText, setCustomText] = useState('');
  const [config, setConfig]         = useState<PrinterPortConfig>({ ...DEFAULT_PORT_CONFIG });

  const addLog = useCallback((type: LogEntry['type'], text: string) => {
    setLogs((prev) => [{ type, text, ts: logTs() }, ...prev].slice(0, 100));
  }, []);

  // ── Conectar ──────────────────────────────────────────────────────────────
  const handleConnect = async () => {
    setLoading(true);
    addLog('info', 'Conectando con la impresora…');
    const result = await connectPrinter(config);
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
            POS-5890U — Conexión USB / Serial (ESC/POS)
          </p>
        </div>
        <StatusBadge />
      </div>

      {/* ── Configuración de puerto ──────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow p-5 space-y-4">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <FaSlidersH /> Parámetros del puerto serial
        </h3>
        <p className="text-xs text-gray-500">
          La POS-5890U suele operar a <strong>115200</strong> o <strong>9600</strong> bps.
          Si un baud rate no funciona, prueba el otro.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* Baud Rate */}
          <label className="flex flex-col text-sm text-gray-600">
            Velocidad (baud)
            <select
              className="mt-1 border rounded px-2 py-1 text-gray-800"
              value={config.baudRate}
              onChange={(e) =>
                setConfig((c) => ({ ...c, baudRate: Number(e.target.value) }))
              }
            >
              {BAUD_RATES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>

          {/* Data Bits */}
          <label className="flex flex-col text-sm text-gray-600">
            Bits de datos
            <select
              className="mt-1 border rounded px-2 py-1 text-gray-800"
              value={config.dataBits}
              onChange={(e) =>
                setConfig((c) => ({ ...c, dataBits: Number(e.target.value) as 7 | 8 }))
              }
            >
              {[7, 8].map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>

          {/* Stop Bits */}
          <label className="flex flex-col text-sm text-gray-600">
            Bits de parada
            <select
              className="mt-1 border rounded px-2 py-1 text-gray-800"
              value={config.stopBits}
              onChange={(e) =>
                setConfig((c) => ({ ...c, stopBits: Number(e.target.value) as 1 | 2 }))
              }
            >
              {[1, 2].map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>

          {/* Paridad */}
          <label className="flex flex-col text-sm text-gray-600">
            Paridad
            <select
              className="mt-1 border rounded px-2 py-1 text-gray-800"
              value={config.parity}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  parity: e.target.value as ParityType,
                }))
              }
            >
              {['none', 'even', 'odd'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          {/* Buffer size */}
          <label className="flex flex-col text-sm text-gray-600">
            Buffer (bytes)
            <input
              type="number"
              min={512}
              max={65536}
              step={512}
              className="mt-1 border rounded px-2 py-1 text-gray-800"
              value={config.bufferSize}
              onChange={(e) =>
                setConfig((c) => ({ ...c, bufferSize: Number(e.target.value) }))
              }
            />
          </label>
        </div>
      </section>

      {/* ── Acciones de conexión ─────────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Control de conexión</h3>
        <div className="flex flex-wrap gap-3">
          <button
            disabled={loading || connected}
            onClick={handleConnect}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPlug />
            {loading && !connected ? 'Conectando…' : 'Conectar'}
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
          Al hacer clic en "Conectar" el navegador/Tauri solicitará permiso para
          acceder al puerto serial USB. Selecciona el puerto de la POS-5890U.
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
            Envía el comando de inicialización ESC @ y un "PING OK" para
            verificar que la comunicación funciona.
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
          <li>Interfaz física: USB CDC-ACM (aparece como COM en Windows, /dev/ttyUSB* en Linux)</li>
          <li>Ancho de papel: 58 mm (~32 caracteres fuente normal)</li>
          <li>Velocidad recomendada: 115200 bps (o 9600 bps en modo legado)</li>
          <li>Codificación: PC850 / Latin-1</li>
          <li>Corte automático: parcial (comanda GS V 1)</li>
        </ul>
      </section>
    </div>
  );
}
