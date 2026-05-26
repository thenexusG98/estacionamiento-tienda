/**
 * ThermalPrinter.ts
 * Driver ESC/POS para impresora POS-5890U (58mm / 80mm) vía Web Serial API (USB CDC)
 * La POS-5890U aparece en Windows como puerto COM (USB Serial) y en macOS/Linux como /dev/ttyUSB* o /dev/cu.*
 */

// ─── Constantes ESC/POS ───────────────────────────────────────────────────────
const ESC = 0x1b;
const GS  = 0x1d;
const LF  = 0x0a;

export const CMD = {
  INIT:           [ESC, 0x40],
  LINE_FEED:      [LF],
  CUT_FULL:       [GS, 0x56, 0x00],
  CUT_PARTIAL:    [GS, 0x56, 0x01],

  // Alineación
  ALIGN_LEFT:     [ESC, 0x61, 0x00],
  ALIGN_CENTER:   [ESC, 0x61, 0x01],
  ALIGN_RIGHT:    [ESC, 0x61, 0x02],

  // Estilo de fuente
  BOLD_ON:        [ESC, 0x45, 0x01],
  BOLD_OFF:       [ESC, 0x45, 0x00],
  UNDERLINE_ON:   [ESC, 0x2d, 0x01],
  UNDERLINE_OFF:  [ESC, 0x2d, 0x00],
  DOUBLE_HEIGHT:  [ESC, 0x21, 0x10],
  DOUBLE_WIDTH:   [ESC, 0x21, 0x20],
  DOUBLE_BOTH:    [ESC, 0x21, 0x30],
  NORMAL_SIZE:    [ESC, 0x21, 0x00],

  // Charset
  CHARSET_PC850:  [ESC, 0x74, 0x02],   // Latin-1 / PC850
  CHARSET_UTF8:   [ESC, 0x74, 0x00],

  // Cashbox
  CASH_DRAWER:    [ESC, 0x70, 0x00, 0x19, 0xfa],
} as const;

// ─── Config de puerto por defecto ────────────────────────────────────────────
export interface PrinterPortConfig {
  baudRate:   number;         // 9600 | 38400 | 115200  (POS-5890U: 9600 o 115200)
  dataBits:   7 | 8;          // 8
  stopBits:   1 | 2;          // 1
  parity:     ParityType;     // 'none'
  bufferSize: number;         // bytes
}

export const DEFAULT_PORT_CONFIG: PrinterPortConfig = {
  baudRate:   115200,
  dataBits:   8,
  stopBits:   1,
  parity:     'none',
  bufferSize: 4096,
};

// ─── Estado de conexión ───────────────────────────────────────────────────────
let _port:   SerialPort | null = null;
let _writer: WritableStreamDefaultWriter<Uint8Array> | null = null;

export function isPrinterConnected(): boolean {
  return _port !== null && _writer !== null;
}

// ─── Conectar ─────────────────────────────────────────────────────────────────
export async function connectPrinter(
  config: Partial<PrinterPortConfig> = {}
): Promise<{ ok: boolean; message: string }> {
  try {
    if (!('serial' in navigator)) {
      return { ok: false, message: 'Web Serial API no disponible en este navegador/entorno.' };
    }

    const portConfig = { ...DEFAULT_PORT_CONFIG, ...config };

    // Intentar reusar puerto ya autorizado
    const ports = await navigator.serial.getPorts();
    // Filtrar por vendor/product si se conocen (POS-5890U no tiene VID/PID estándar único,
    // pero podemos intentar con el primero disponible)
    _port = ports.length > 0 ? ports[0] : await navigator.serial.requestPort();

    await _port.open(portConfig);

    const writer = _port.writable?.getWriter();
    if (!writer) throw new Error('No se pudo obtener el escritor del puerto serial.');
    _writer = writer;

    // Enviar INIT para resetear impresora
    await _writeBytes(CMD.INIT);
    await _writeBytes(CMD.CHARSET_PC850);

    return { ok: true, message: 'Impresora conectada correctamente.' };
  } catch (err: any) {
    _port   = null;
    _writer = null;
    const msg = err?.message ?? String(err);
    return { ok: false, message: `Error al conectar: ${msg}` };
  }
}

// ─── Desconectar ──────────────────────────────────────────────────────────────
export async function disconnectPrinter(): Promise<void> {
  try {
    if (_writer) {
      _writer.releaseLock();
      _writer = null;
    }
    if (_port) {
      await _port.close();
      _port = null;
    }
  } catch (_) {
    _port   = null;
    _writer = null;
  }
}

// ─── Escritura de bytes raw ───────────────────────────────────────────────────
async function _writeBytes(bytes: readonly number[] | number[]): Promise<void> {
  if (!_writer) throw new Error('Impresora no conectada.');
  await _writer.write(new Uint8Array(bytes));
}

async function _writeText(text: string): Promise<void> {
  const encoded = new TextEncoder().encode(text);
  if (!_writer) throw new Error('Impresora no conectada.');
  await _writer.write(encoded);
}

// ─── API de alto nivel ────────────────────────────────────────────────────────

export async function printerInit(): Promise<void> {
  await _writeBytes(CMD.INIT);
}

export async function printerFeed(lines = 1): Promise<void> {
  for (let i = 0; i < lines; i++) {
    await _writeBytes(CMD.LINE_FEED);
  }
}

export async function printerCut(partial = true): Promise<void> {
  await printerFeed(3);
  await _writeBytes(partial ? CMD.CUT_PARTIAL : CMD.CUT_FULL);
}

export async function printerLine(
  text: string,
  opts: { bold?: boolean; align?: 'left' | 'center' | 'right'; size?: 'normal' | 'double' } = {}
): Promise<void> {
  const { bold = false, align = 'left', size = 'normal' } = opts;

  // Alineación
  if (align === 'center') await _writeBytes(CMD.ALIGN_CENTER);
  else if (align === 'right') await _writeBytes(CMD.ALIGN_RIGHT);
  else await _writeBytes(CMD.ALIGN_LEFT);

  // Tamaño
  if (size === 'double') await _writeBytes(CMD.DOUBLE_BOTH);
  else await _writeBytes(CMD.NORMAL_SIZE);

  // Negrita
  if (bold) await _writeBytes(CMD.BOLD_ON);

  await _writeText(text + '\n');

  // Restaurar
  if (bold) await _writeBytes(CMD.BOLD_OFF);
  if (size === 'double') await _writeBytes(CMD.NORMAL_SIZE);
  await _writeBytes(CMD.ALIGN_LEFT);
}

export async function printerSeparator(char = '-', cols = 32): Promise<void> {
  await _writeBytes(CMD.ALIGN_LEFT);
  await _writeBytes(CMD.NORMAL_SIZE);
  await _writeText(char.repeat(cols) + '\n');
}

/**
 * Imprime dos textos en la misma línea: izquierda y derecha,
 * rellenando con espacios para llenar el ancho de la hoja.
 * La POS-5890U a 58mm tiene ~32 cols en fuente normal.
 */
export async function printerRow(left: string, right: string, cols = 32): Promise<void> {
  await _writeBytes(CMD.ALIGN_LEFT);
  await _writeBytes(CMD.NORMAL_SIZE);
  const pad = cols - left.length - right.length;
  const spaces = pad > 0 ? ' '.repeat(pad) : ' ';
  await _writeText(left + spaces + right + '\n');
}

// ─── Test de comunicación ─────────────────────────────────────────────────────
export async function printerTestPage(): Promise<{ ok: boolean; message: string }> {
  if (!isPrinterConnected()) {
    return { ok: false, message: 'La impresora no está conectada.' };
  }
  try {
    await printerInit();
    await printerLine('=== PRUEBA DE IMPRESION ===', { align: 'center', bold: true });
    await printerSeparator('-', 32);
    await printerLine('  POS-5890U  OK', { align: 'center' });
    await printerLine(`Fecha: ${new Date().toLocaleString('es-MX')}`, { align: 'center' });
    await printerSeparator('-', 32);
    await printerLine('Texto normal', { align: 'left' });
    await printerLine('Texto negrita', { align: 'left', bold: true });
    await printerLine('Texto centrado', { align: 'center' });
    await printerLine('Texto derecha', { align: 'right' });
    await printerSeparator('=', 32);
    await printerLine('Impresion exitosa!', { align: 'center', bold: true });
    await printerSeparator('-', 32);
    await printerCut(true);
    return { ok: true, message: 'Página de prueba enviada correctamente.' };
  } catch (err: any) {
    return { ok: false, message: `Error durante la prueba: ${err?.message ?? err}` };
  }
}

// ─── Ticket Estacionamiento ESC/POS ──────────────────────────────────────────
export async function imprimirTicketEstacionamiento(
  id: string | number,
  placas: string
): Promise<{ ok: boolean; message: string }> {
  if (!isPrinterConnected()) {
    return { ok: false, message: 'La impresora no está conectada.' };
  }
  try {
    await printerInit();
    await printerLine('ESTACIONAMIENTO', { align: 'center', bold: true });
    await printerSeparator('-', 32);
    await printerRow('ID:', String(id));
    await printerRow('Placas:', placas);
    await printerRow('Entrada:', new Date().toLocaleTimeString('es-MX'));
    await printerRow('Fecha:', new Date().toLocaleDateString('es-MX'));
    await printerSeparator('-', 32);
    await printerLine('Gracias por su visita', { align: 'center' });
    await printerCut(true);
    return { ok: true, message: 'Ticket de estacionamiento impreso.' };
  } catch (err: any) {
    return { ok: false, message: `Error al imprimir: ${err?.message ?? err}` };
  }
}

// ─── Ticket Paquetería ESC/POS ───────────────────────────────────────────────
export async function imprimirTicketPaqueteria(
  id: number
): Promise<{ ok: boolean; message: string }> {
  if (!isPrinterConnected()) {
    return { ok: false, message: 'La impresora no está conectada.' };
  }

  const imprimirCopia = async (titulo: string) => {
    await printerInit();
    await printerLine('PAQUETERIA', { align: 'center', bold: true });
    await printerLine(titulo, { align: 'center' });
    await printerSeparator('-', 32);
    await printerRow('ID:', String(id));
    await printerRow('Fecha:', new Date().toLocaleDateString('es-MX'));
    await printerRow('Hora:', new Date().toLocaleTimeString('es-MX'));
    await printerSeparator('-', 32);
    await printerLine('Gracias por su preferencia', { align: 'center' });
  };

  try {
    await imprimirCopia('- Ticket Cliente -');
    await printerCut(true);
    await imprimirCopia('- Ticket Interno -');
    await printerCut(true);
    return { ok: true, message: 'Tickets de paquetería impresos.' };
  } catch (err: any) {
    return { ok: false, message: `Error al imprimir: ${err?.message ?? err}` };
  }
}
