import { useState, useEffect } from 'react';
import { 
  obtenerLogs, 
  limpiarLogsAntiguos, 
  obtenerEstadisticasLogs,
  LogLevel,
  LogCategory 
} from '../lib/Logger';
import { FaTrash, FaDownload, FaFilter, FaChartBar, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';

interface LogEntry {
  id?: number;
  nivel: string;
  categoria: string;
  mensaje: string;
  detalles?: string;
  usuario_id?: number;
  usuario_nombre?: string;
  fecha_hora: string;
  stack_trace?: string;
}

export default function BitacoraLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filtroNivel, setFiltroNivel] = useState<string>('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [limite, setLimite] = useState<number>(100);
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);
  const [estadisticas, setEstadisticas] = useState<any[]>([]);
  const [logSeleccionado, setLogSeleccionado] = useState<LogEntry | null>(null);

  // Verificar que el usuario es administrador
  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-lg max-w-md text-center">
          <FaExclamationTriangle className="text-5xl mx-auto mb-4 text-red-600" />
          <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
          <p className="mb-4">
            Solo los administradores pueden acceder a la bitácora de logs del sistema.
          </p>
          <p className="text-sm">
            Si necesitas acceso, contacta con el administrador del sistema.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    cargarLogs();
  }, [filtroNivel, filtroCategoria, limite]);

  const cargarLogs = async () => {
    const filtros: any = { limite };
    
    if (filtroNivel) filtros.nivel = filtroNivel as LogLevel;
    if (filtroCategoria) filtros.categoria = filtroCategoria as LogCategory;

    const logsObtenidos = await obtenerLogs(filtros);
    setLogs(logsObtenidos);
  };

  const cargarEstadisticas = async () => {
    const stats = await obtenerEstadisticasLogs();
    setEstadisticas(stats);
    setMostrarEstadisticas(true);
  };

  const limpiarLogs = async () => {
    if (window.confirm('¿Deseas eliminar logs con más de 30 días de antigüedad?')) {
      await limpiarLogsAntiguos(30);
      alert('✅ Logs antiguos eliminados');
      cargarLogs();
    }
  };

  const exportarLogs = () => {
    const csv = [
      ['ID', 'Fecha/Hora', 'Nivel', 'Categoría', 'Mensaje', 'Usuario', 'Detalles'].join(','),
      ...logs.map(log => [
        log.id,
        log.fecha_hora,
        log.nivel,
        log.categoria,
        `"${log.mensaje.replace(/"/g, '""')}"`,
        log.usuario_nombre || 'Sistema',
        log.detalles ? `"${log.detalles.replace(/"/g, '""')}"` : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `logs_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getColorNivel = (nivel: string) => {
    switch (nivel) {
      case 'DEBUG': return 'bg-gray-100 text-gray-800';
      case 'INFO': return 'bg-blue-100 text-blue-800';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      case 'CRITICAL': return 'bg-red-600 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIconoNivel = (nivel: string) => {
    switch (nivel) {
      case 'DEBUG': return '🔍';
      case 'INFO': return 'ℹ️';
      case 'WARNING': return '⚠️';
      case 'ERROR': return '❌';
      case 'CRITICAL': return '🔥';
      default: return '📝';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📋 Bitácora de Logs</h2>
        <div className="flex gap-2">
          <button
            onClick={cargarEstadisticas}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <FaChartBar /> Estadísticas
          </button>
          <button
            onClick={exportarLogs}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FaDownload /> Exportar CSV
          </button>
          <button
            onClick={limpiarLogs}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <FaTrash /> Limpiar Antiguos
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-600" />
            <span className="font-semibold">Filtros:</span>
          </div>
          
          <select
            value={filtroNivel}
            onChange={(e) => setFiltroNivel(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">Todos los niveles</option>
            <option value="DEBUG">🔍 DEBUG</option>
            <option value="INFO">ℹ️ INFO</option>
            <option value="WARNING">⚠️ WARNING</option>
            <option value="ERROR">❌ ERROR</option>
            <option value="CRITICAL">🔥 CRITICAL</option>
          </select>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">Todas las categorías</option>
            <option value="DATABASE">💾 BASE DE DATOS</option>
            <option value="AUTH">🔐 AUTENTICACIÓN</option>
            <option value="TICKETS">🎫 TICKETS</option>
            <option value="VENTAS">💰 VENTAS</option>
            <option value="PAQUETERIA">📦 PAQUETERÍA</option>
            <option value="PRINT">🖨️ IMPRESIÓN</option>
            <option value="SYSTEM">⚙️ SISTEMA</option>
            <option value="UI">🖥️ INTERFAZ</option>
          </select>

          <select
            value={limite}
            onChange={(e) => setLimite(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="50">50 registros</option>
            <option value="100">100 registros</option>
            <option value="500">500 registros</option>
            <option value="1000">1000 registros</option>
          </select>

          <button
            onClick={cargarLogs}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Modal de Estadísticas */}
      {mostrarEstadisticas && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-auto">
            <h3 className="text-xl font-bold mb-4">📊 Estadísticas de Logs</h3>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Nivel</th>
                  <th className="p-2 text-left">Categoría</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {estadisticas.map((stat, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${getColorNivel(stat.nivel)}`}>
                        {getIconoNivel(stat.nivel)} {stat.nivel}
                      </span>
                    </td>
                    <td className="p-2">{stat.categoria}</td>
                    <td className="p-2 text-right font-semibold">{stat.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() => setMostrarEstadisticas(false)}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Detalles */}
      {logSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-3xl w-full max-h-96 overflow-auto">
            <h3 className="text-xl font-bold mb-4">📝 Detalles del Log</h3>
            <div className="space-y-2">
              <div><strong>ID:</strong> {logSeleccionado.id}</div>
              <div><strong>Fecha/Hora:</strong> {logSeleccionado.fecha_hora}</div>
              <div>
                <strong>Nivel:</strong>{' '}
                <span className={`px-2 py-1 rounded text-sm ${getColorNivel(logSeleccionado.nivel)}`}>
                  {getIconoNivel(logSeleccionado.nivel)} {logSeleccionado.nivel}
                </span>
              </div>
              <div><strong>Categoría:</strong> {logSeleccionado.categoria}</div>
              <div><strong>Usuario:</strong> {logSeleccionado.usuario_nombre || 'Sistema'}</div>
              <div><strong>Mensaje:</strong> {logSeleccionado.mensaje}</div>
              {logSeleccionado.detalles && (
                <div>
                  <strong>Detalles:</strong>
                  <pre className="bg-gray-100 p-3 rounded mt-2 text-xs overflow-auto max-h-40">
                    {logSeleccionado.detalles}
                  </pre>
                </div>
              )}
              {logSeleccionado.stack_trace && (
                <div>
                  <strong>Stack Trace:</strong>
                  <pre className="bg-red-50 p-3 rounded mt-2 text-xs overflow-auto max-h-40 text-red-800">
                    {logSeleccionado.stack_trace}
                  </pre>
                </div>
              )}
            </div>
            <button
              onClick={() => setLogSeleccionado(null)}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Tabla de Logs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Fecha/Hora</th>
                <th className="p-3 text-left">Nivel</th>
                <th className="p-3 text-left">Categoría</th>
                <th className="p-3 text-left">Mensaje</th>
                <th className="p-3 text-left">Usuario</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    No hay logs para mostrar
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{log.fecha_hora}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${getColorNivel(log.nivel)}`}>
                        {getIconoNivel(log.nivel)} {log.nivel}
                      </span>
                    </td>
                    <td className="p-3 text-sm">{log.categoria}</td>
                    <td className="p-3 text-sm max-w-xs truncate">{log.mensaje}</td>
                    <td className="p-3 text-sm">{log.usuario_nombre || 'Sistema'}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setLogSeleccionado(log)}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Total de registros: <strong>{logs.length}</strong>
      </div>
    </div>
  );
}
