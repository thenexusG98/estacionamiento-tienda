/**
 * ConfigImpresora.tsx
 * Panel de gestión de cola de impresión para evitar atascos en el spooler de Windows.
 * Permite detectar impresoras instaladas, limpiar la cola y hacer pruebas de impresión.
 */
import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import printjs from 'print-js';
import {
  FaPrint,
  FaTrash,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
} from 'react-icons/fa';

pdfMake.vfs = pdfFonts.vfs;

const STORAGE_KEY = 'pos_printer_name';

type LogEntry = { type: 'ok' | 'error' | 'info'; text: string; ts: string };

function logTs(): string {
  return new Date().toLocaleTimeString('es-MX');
}

export default function ConfigImpresora() {
  const [printerName, setPrinterName] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? ''
  );
  const [printers, setPrinters] = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);
  const [logs, setLogs]         = useState<LogEntry[]>([]);

  const addLog = useCallback((type: LogEntry['type'], text: string) => {
    setLogs((prev) => [{ type, text, ts: logTs() }, ...prev].slice(0, 100));
  }, []);

  // Persistir el nombre en localStorage cada vez que el usuario lo cambia
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, printerName);
  }, [printerName]);

  // ── Detectar impresoras instaladas ────────────────────────────────────────
  const handleDetectar = async () => {
    setLoading(true);
    addLog('info', 'Consultando impresoras instaladas en Windows…');
    try {
      const lista = await invoke<string[]>('list_printers');
      setPrinters(lista);
      if (lista.length === 0) {
        addLog('error', 'No se encontraron impresoras instaladas.');
      } else {
        addLog('ok', `${lista.length} impresora(s): ${lista.join(', ')}`);
      }
    } catch (err: any) {
      addLog('error', `Error al listar impresoras: ${err?.message ?? err}`);
    }
    setLoading(false);
  };

  // ── Limpiar cola de impresión ─────────────────────────────────────────────
  const handlePurge = async () => {
    if (!printerName.trim()) {
      addLog('error', 'Selecciona o escribe el nombre de la impresora primero.');
      return;
    }
    setLoading(true);
    addLog('info', `Limpiando cola de "${printerName}"…`);
    try {
      const msg = await invoke<string>('purge_print_queue', { printerName });
      addLog('ok', msg || 'Cola limpiada.');
    } catch (err: any) {
      addLog('error', `Error al limpiar cola: ${err?.message ?? err}`);
    }
    setLoading(false);
  };

  // ── Página de prueba ──────────────────────────────────────────────────────
  const handleTestPrint = async () => {
    if (!printerName.trim()) {
      addLog('error', 'Selecciona o escribe el nombre de la impresora primero.');
      return;
    }
    setLoading(true);
    addLog('info', `Enviando página de prueba a "${printerName}"…`);
    try {
      // Auto-purge antes de imprimir para evitar que se quede atascada
      await invoke('purge_print_queue', { printerName }).catch(() => {});
      await new Promise(r => setTimeout(r, 300));

      const doc = {
        pageSize: { width: 100, height: 'auto' as any },
        pageMargins: [4, 4, 4, 4] as [number, number, number, number],
        content: [
          { text: '=== PRUEBA DE IMPRESORA ===', alignment: 'center', fontSize: 9, bold: true },
          { text: printerName, alignment: 'center', fontSize: 7, margin: [0, 2, 0, 2] },
          { text: new Date().toLocaleString('es-MX'), alignment: 'center', fontSize: 7 },
          { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 92, y2: 4, lineWidth: 0.5 }] },
          { text: 'Impresión OK', alignment: 'center', fontSize: 9, margin: [0, 4, 0, 4] },
          { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 92, y2: 4, lineWidth: 0.5 }] },
        ],
      };

      const pdf = pdfMake.createPdf(doc as any);
      pdf.getBase64((data) => {
        printjs({ printable: data, type: 'pdf', base64: true });
        addLog('ok', 'Trabajo de prueba enviado al spooler.');
        setLoading(false);
      });
    } catch (err: any) {
      addLog('error', `Error: ${err?.message ?? err}`);
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Encabezado */}
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <FaPrint className="text-blue-600" />
        Gestión de Impresora POS
      </h2>

      {/* ── Nombre / selección ───────────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow p-5 space-y-4">
        <h3 className="font-semibold text-gray-700">Impresora activa</h3>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
          <p className="font-semibold flex items-center gap-1"><FaInfoCircle /> ¿Cómo configurar?</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Haz clic en <strong>"Detectar impresoras"</strong> para ver las instaladas.</li>
            <li>Selecciona tu impresora POS de la lista o escríbela manualmente.</li>
            <li>El nombre se guarda automáticamente y se usará en cada impresión.</li>
          </ol>
        </div>

        {/* Input de nombre */}
        <div className="flex gap-3 items-end flex-wrap">
          <label className="flex flex-col text-sm text-gray-600 flex-1 min-w-[200px]">
            Nombre de la impresora (tal como aparece en Windows)
            <input
              type="text"
              value={printerName}
              onChange={(e) => setPrinterName(e.target.value)}
              placeholder="ej: POS-5890U"
              className="mt-1 border rounded px-3 py-2 text-gray-800"
            />
          </label>

          <button
            disabled={loading}
            onClick={handleDetectar}
            className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSearch />
            {loading ? 'Buscando…' : 'Detectar impresoras'}
          </button>
        </div>

        {/* Lista de impresoras detectadas */}
        {printers.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-gray-500 font-medium">Impresoras detectadas — haz clic para seleccionar:</p>
            <div className="flex flex-wrap gap-2">
              {printers.map((p) => (
                <button
                  key={p}
                  onClick={() => { setPrinterName(p); addLog('info', `Seleccionada: ${p}`); }}
                  className={`px-3 py-1 rounded text-sm border transition-colors ${
                    printerName === p
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400'
                  }`}
                >
                  {printerName === p
                    ? <><FaCheckCircle className="inline mr-1" />{p}</>
                    : p}
                </button>
              ))}
            </div>
          </div>
        )}

        {printerName.trim() && (
          <p className="text-xs text-green-700 flex items-center gap-1">
            <FaCheckCircle /> Guardado en configuración: <strong>{printerName}</strong>
          </p>
        )}
        {!printerName.trim() && (
          <p className="text-xs text-orange-600 flex items-center gap-1">
            <FaTimesCircle /> Sin impresora configurada — las impresiones podrían fallar.
          </p>
        )}
      </section>

      {/* ── Acciones de cola ─────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow p-5 space-y-4">
        <h3 className="font-semibold text-gray-700">Control de cola de impresión</h3>
        <p className="text-xs text-gray-500">
          Si la impresora deja de responder después de varios tickets, usa <strong>"Limpiar cola"</strong>
          para eliminar trabajos en error que bloquean el spooler de Windows.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            disabled={loading || !printerName.trim()}
            onClick={handlePurge}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaTrash />
            {loading ? 'Limpiando…' : 'Limpiar cola de impresión'}
          </button>

          <button
            disabled={loading || !printerName.trim()}
            onClick={handleTestPrint}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPrint />
            {loading ? 'Enviando…' : 'Imprimir página de prueba'}
          </button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
          <p className="font-semibold">Nota:</p>
          <p>La limpieza de cola ocurre <strong>automáticamente</strong> antes de cada ticket impreso
            en el sistema. Este botón es para limpiar manualmente cuando la impresora no responde.</p>
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
        <p className="font-semibold">¿Por qué se atasca la cola?</p>
        <ul className="list-disc list-inside space-y-0.5 text-xs text-blue-700">
          <li>Cada ticket se envía como un PDF al spooler de Windows.</li>
          <li>Si la impresora está ocupada o desconectada, el trabajo queda en estado <strong>Error</strong>.</li>
          <li>Los tickets siguientes se encolan detrás del trabajo atascado y tampoco imprimen.</li>
          <li>La limpieza automática elimina esos trabajos antes de enviar cada nuevo ticket.</li>
          <li>Si el problema persiste, verifica que el nombre de la impresora sea correcto.</li>
        </ul>
      </section>

    </div>
  );
}
