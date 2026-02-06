// Sistema de Bitácora de Errores y Logs
import Database from '@tauri-apps/plugin-sql';

const dbFile = 'sqlite:data.db';

// Niveles de log
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

// Categorías de log
export enum LogCategory {
  DATABASE = 'DATABASE',
  AUTH = 'AUTH',
  TICKETS = 'TICKETS',
  VENTAS = 'VENTAS',
  PAQUETERIA = 'PAQUETERIA',
  PRINT = 'PRINT',
  SYSTEM = 'SYSTEM',
  UI = 'UI'
}

interface LogEntry {
  id?: number;
  nivel: LogLevel;
  categoria: LogCategory;
  mensaje: string;
  detalles?: string;
  usuario_id?: number;
  usuario_nombre?: string;
  fecha_hora: string;
  stack_trace?: string;
}

// Función helper para obtener fecha y hora local
function obtenerFechaHoraLocal(): string {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  const horas = String(ahora.getHours()).padStart(2, '0');
  const minutos = String(ahora.getMinutes()).padStart(2, '0');
  const segundos = String(ahora.getSeconds()).padStart(2, '0');
  const milisegundos = String(ahora.getMilliseconds()).padStart(3, '0');
  return `${año}-${mes}-${dia} ${horas}:${minutos}:${segundos}.${milisegundos}`;
}

// Inicializar tabla de logs
async function initLogTable() {
  try {
    const db = await Database.load(dbFile);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nivel TEXT NOT NULL,
        categoria TEXT NOT NULL,
        mensaje TEXT NOT NULL,
        detalles TEXT,
        usuario_id INTEGER,
        usuario_nombre TEXT,
        fecha_hora TEXT NOT NULL,
        stack_trace TEXT
      );
    `);

    // Crear índices para mejorar consultas
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_logs_nivel ON logs(nivel);
    `);
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_logs_categoria ON logs(categoria);
    `);
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_logs_fecha ON logs(fecha_hora);
    `);
  } catch (error) {
    console.error('Error al inicializar tabla de logs:', error);
  }
}

// Clase Logger principal
class Logger {
  private static instance: Logger;
  private usuarioActual: { id: number; nombre: string } | null = null;
  private maxLogsEnConsola = 100; // Límite de logs en consola para no saturar
  private logsEnConsola = 0;

  private constructor() {
    initLogTable();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setUsuario(usuario: { id: number; nombre: string } | null) {
    this.usuarioActual = usuario;
  }

  private async guardarLog(entry: LogEntry) {
    try {
      const db = await Database.load(dbFile);
      await db.execute(
        `INSERT INTO logs (nivel, categoria, mensaje, detalles, usuario_id, usuario_nombre, fecha_hora, stack_trace)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.nivel,
          entry.categoria,
          entry.mensaje,
          entry.detalles || null,
          entry.usuario_id || null,
          entry.usuario_nombre || null,
          entry.fecha_hora,
          entry.stack_trace || null
        ]
      );
    } catch (error) {
      console.error('Error al guardar log en BD:', error);
    }
  }

  private formatearMensajeConsola(entry: LogEntry): string {
    const iconos = {
      [LogLevel.DEBUG]: '🔍',
      [LogLevel.INFO]: 'ℹ️',
      [LogLevel.WARNING]: '⚠️',
      [LogLevel.ERROR]: '❌',
      [LogLevel.CRITICAL]: '🔥'
    };

    return `${iconos[entry.nivel]} [${entry.fecha_hora}] [${entry.categoria}] ${entry.mensaje}`;
  }

  private log(nivel: LogLevel, categoria: LogCategory, mensaje: string, detalles?: any, error?: Error) {
    const entry: LogEntry = {
      nivel,
      categoria,
      mensaje,
      detalles: detalles ? JSON.stringify(detalles, null, 2) : undefined,
      usuario_id: this.usuarioActual?.id,
      usuario_nombre: this.usuarioActual?.nombre,
      fecha_hora: obtenerFechaHoraLocal(),
      stack_trace: error?.stack
    };

    // Guardar en base de datos (async, no bloqueante)
    this.guardarLog(entry);

    // Mostrar en consola con límite
    if (this.logsEnConsola < this.maxLogsEnConsola) {
      const mensajeConsola = this.formatearMensajeConsola(entry);
      
      switch (nivel) {
        case LogLevel.DEBUG:
          console.debug(mensajeConsola, detalles);
          break;
        case LogLevel.INFO:
          console.info(mensajeConsola, detalles);
          break;
        case LogLevel.WARNING:
          console.warn(mensajeConsola, detalles);
          break;
        case LogLevel.ERROR:
        case LogLevel.CRITICAL:
          console.error(mensajeConsola, detalles, error);
          break;
      }
      
      this.logsEnConsola++;
    } else if (this.logsEnConsola === this.maxLogsEnConsola) {
      console.warn('⚠️ Límite de logs en consola alcanzado. Los logs seguirán guardándose en BD.');
      this.logsEnConsola++;
    }
  }

  // Métodos públicos para cada nivel de log
  public debug(categoria: LogCategory, mensaje: string, detalles?: any) {
    this.log(LogLevel.DEBUG, categoria, mensaje, detalles);
  }

  public info(categoria: LogCategory, mensaje: string, detalles?: any) {
    this.log(LogLevel.INFO, categoria, mensaje, detalles);
  }

  public warning(categoria: LogCategory, mensaje: string, detalles?: any) {
    this.log(LogLevel.WARNING, categoria, mensaje, detalles);
  }

  public error(categoria: LogCategory, mensaje: string, detalles?: any, error?: Error) {
    this.log(LogLevel.ERROR, categoria, mensaje, detalles, error);
  }

  public critical(categoria: LogCategory, mensaje: string, detalles?: any, error?: Error) {
    this.log(LogLevel.CRITICAL, categoria, mensaje, detalles, error);
  }

  // Método especial para capturar errores no manejados
  public captureError(error: Error, categoria: LogCategory = LogCategory.SYSTEM, contexto?: string) {
    this.error(
      categoria,
      contexto || 'Error no manejado',
      {
        nombre: error.name,
        mensaje: error.message,
        stack: error.stack
      },
      error
    );
  }
}

// Exportar instancia singleton
export const logger = Logger.getInstance();

// Funciones de utilidad para consultar logs
export async function obtenerLogs(filtros?: {
  nivel?: LogLevel;
  categoria?: LogCategory;
  fechaInicio?: string;
  fechaFin?: string;
  limite?: number;
}) {
  try {
    const db = await Database.load(dbFile);
    let query = 'SELECT * FROM logs WHERE 1=1';
    const params: any[] = [];

    if (filtros?.nivel) {
      query += ' AND nivel = ?';
      params.push(filtros.nivel);
    }

    if (filtros?.categoria) {
      query += ' AND categoria = ?';
      params.push(filtros.categoria);
    }

    if (filtros?.fechaInicio) {
      query += ' AND fecha_hora >= ?';
      params.push(filtros.fechaInicio);
    }

    if (filtros?.fechaFin) {
      query += ' AND fecha_hora <= ?';
      params.push(filtros.fechaFin);
    }

    query += ' ORDER BY fecha_hora DESC';

    if (filtros?.limite) {
      query += ' LIMIT ?';
      params.push(filtros.limite);
    }

    const logs = await db.select<LogEntry[]>(query, params.length > 0 ? params : undefined);
    return logs;
  } catch (error) {
    console.error('Error al obtener logs:', error);
    return [];
  }
}

export async function limpiarLogsAntiguos(diasAntiguedad: number = 30) {
  try {
    const db = await Database.load(dbFile);
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - diasAntiguedad);
    
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const fechaLimite = `${año}-${mes}-${dia}`;

    await db.execute(
      'DELETE FROM logs WHERE fecha_hora < ?',
      [fechaLimite]
    );

    logger.info(LogCategory.SYSTEM, 'Logs antiguos limpiados', { diasAntiguedad, fechaLimite });
  } catch (error) {
    console.error('Error al limpiar logs antiguos:', error);
  }
}

export async function obtenerEstadisticasLogs() {
  try {
    const db = await Database.load(dbFile);
    
    const stats = await db.select<{
      nivel: string;
      categoria: string;
      total: number;
    }[]>(`
      SELECT 
        nivel,
        categoria,
        COUNT(*) as total
      FROM logs
      GROUP BY nivel, categoria
      ORDER BY total DESC
    `);

    return stats;
  } catch (error) {
    console.error('Error al obtener estadísticas de logs:', error);
    return [];
  }
}

// Exportar para uso global
export default logger;
