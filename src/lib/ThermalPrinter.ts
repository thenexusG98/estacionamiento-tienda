/**
 * ThermalPrinter.ts
 * Driver ESC/POS para impresora POS-5890U vía puerto USB directo (USB001, USB002, etc.)
 * En Windows estos puertos son rutas de dispositivo (\\\\.\\ USB001) que se abren con
 * CreateFile. El frontend acumula los bytes ESC/POS en un buffer y los envía de una
 * sola vez al backend Rust que los escribe al dispositivo.
 */

import { invoke } from '@tauri-apps/api/core';

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
// ─── Estado de conexión ───────────────────────────────────────────────────────
// _usbPort: nombre del puerto, p. ej. "USB001" (Windows) o "usb/lp0" (Linux)
let _usbPort: string | null = null;
// _buffer:  acumula todos los bytes ESC/POS de un trabajo antes de enviarlos
let _buffer:  number[]      = [];

export function isPrinterConnected(): boolean {
  return _usbPort !== null;
}

export function getPrinterPort(): string | null {
  return _usbPort;
}

// ─── Conectar ─────────────────────────────────────────────────────────────────
// Recibe el nombre del puerto tal como lo muestra Windows: USB001, USB002, etc.
// Verifica la comunicación enviando ESC @ al dispositivo real.
export async function connectPrinter(
  portName: string
): Promise<{ ok: boolean; message: string }> {
  const port = portName.trim().replace(/[\\.\/]/g, '').toUpperCase();
  if (!port) {
    return { ok: false, message: 'Debe ingresar el nombre del puerto (ej: USB001, USB002).' };
  }

  _usbPort = port;
  _buffer  = [];

  // Verificar enviando solo ESC @ (reset) — si el puerto no existe, Rust devuelve error
  _appendBytes(CMD.INIT);
  _appendBytes(CMD.CHARSET_PC850);
  const result = await _flush();
  if (!result.ok) {
    _usbPort = null;
    return { ok: false, message: `No se pudo abrir '${port}': ${result.message}` };
  }
  return { ok: true, message: `Conectada al puerto ${port} correctamente.` };
}

// ─── Desconectar ──────────────────────────────────────────────────────────────
export async function disconnectPrinter(): Promise<void> {
  _usbPort = null;
  _buffer  = [];
}

// ─── Buffer helpers ───────────────────────────────────────────────────────────

// Agrega bytes al buffer. Los bytes se envían todos juntos al llamar _flush().
function _appendBytes(bytes: readonly number[] | number[]): void {
  for (const b of bytes) _buffer.push(b);
}

// Codifica texto como PC850 / Latin-1 y lo agrega al buffer.
function _appendText(text: string): void {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    _buffer.push(code < 256 ? code : 0x3f); // '?' para caracteres fuera de rango
  }
}

// Envía todo el buffer al dispositivo USB via Rust y limpia el buffer.
async function _flush(): Promise<{ ok: boolean; message: string }> {
  if (!_usbPort) return { ok: false, message: 'Sin puerto configurado.' };
  if (_buffer.length === 0) return { ok: true, message: 'OK' };
  const bytes = [..._buffer];
  _buffer = [];
  try {
    await invoke<void>('print_raw_usb', { port: _usbPort, data: bytes });
    return { ok: true, message: 'OK' };
  } catch (err: any) {
    return { ok: false, message: err?.message ?? String(err) };
  }
}

// ─── Hard reset interno ───────────────────────────────────────────────────────
// Prepara el buffer con ESC @ + valores por defecto al inicio de cada ticket.
// Garantiza que la impresora empiece desde el inicio de la hoja.
function _hardReset(): void {
  _buffer = [];              // descartar cualquier byte pendiente
  _appendBytes(CMD.INIT);          // ESC @  — inicializa y mueve cabezal al inicio
  _appendBytes(CMD.ALIGN_LEFT);    // alineación izquierda
  _appendBytes(CMD.NORMAL_SIZE);   // tamaño normal
  _appendBytes(CMD.BOLD_OFF);      // sin negrita
  _appendBytes(CMD.CHARSET_PC850); // charset Latin/PC850
}

// ─── API de alto nivel ────────────────────────────────────────────────────────

export async function printerInit(): Promise<void> {
  _hardReset();
}

export function printerFeed(lines = 1): void {
  for (let i = 0; i < lines; i++) {
    _appendBytes(CMD.LINE_FEED);
  }
}

// printerCut es el único que hace flush — todo lo anterior queda en buffer
export async function printerCut(partial = true): Promise<void> {
  printerFeed(3);
  _appendBytes(partial ? CMD.CUT_PARTIAL : CMD.CUT_FULL);
  const r = await _flush();
  if (!r.ok) throw new Error(r.message);
}

export async function printerLine(
  text: string,
  opts: { bold?: boolean; align?: 'left' | 'center' | 'right'; size?: 'normal' | 'double' } = {}
): Promise<void> {
  const { bold = false, align = 'left', size = 'normal' } = opts;

  if (align === 'center') _appendBytes(CMD.ALIGN_CENTER);
  else if (align === 'right') _appendBytes(CMD.ALIGN_RIGHT);
  else _appendBytes(CMD.ALIGN_LEFT);

  if (size === 'double') _appendBytes(CMD.DOUBLE_BOTH);
  else _appendBytes(CMD.NORMAL_SIZE);

  if (bold) _appendBytes(CMD.BOLD_ON);

  _appendText(text + '\n');

  if (bold) _appendBytes(CMD.BOLD_OFF);
  if (size === 'double') _appendBytes(CMD.NORMAL_SIZE);
  _appendBytes(CMD.ALIGN_LEFT);
}

export async function printerSeparator(char = '-', cols = 32): Promise<void> {
  _appendBytes(CMD.ALIGN_LEFT);
  _appendBytes(CMD.NORMAL_SIZE);
  _appendText(char.repeat(cols) + '\n');
}

/**
 * Imprime dos textos en la misma línea: izquierda y derecha,
 * rellenando con espacios para llenar el ancho de la hoja.
 * La POS-5890U a 58mm tiene ~32 cols en fuente normal.
 */
export async function printerRow(left: string, right: string, cols = 32): Promise<void> {
  _appendBytes(CMD.ALIGN_LEFT);
  _appendBytes(CMD.NORMAL_SIZE);
  const pad = cols - left.length - right.length;
  const spaces = pad > 0 ? ' '.repeat(pad) : ' ';
  _appendText(left + spaces + right + '\n');
}

// ─── Test de comunicación ─────────────────────────────────────────────────────
export async function printerTestPage(): Promise<{ ok: boolean; message: string }> {
  if (!isPrinterConnected()) {
    return { ok: false, message: 'La impresora no está conectada.' };
  }
  try {
    _hardReset();
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
    await printerCut(true); // envia todo el buffer de golpe
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
    _hardReset(); // ESC @ al inicio del buffer: cabezal siempre al principio
    await printerLine('ESTACIONAMIENTO', { align: 'center', bold: true });
    await printerSeparator('-', 32);
    await printerRow('ID:', String(id));
    await printerRow('Placas:', placas);
    await printerRow('Entrada:', new Date().toLocaleTimeString('es-MX'));
    await printerRow('Fecha:', new Date().toLocaleDateString('es-MX'));
    await printerSeparator('-', 32);
    await printerLine('Gracias por su visita', { align: 'center' });
    await printerCut(true); // flush — envía todo en un solo WriteFile
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
    _hardReset(); // ESC @ al inicio del buffer de cada copia
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
    await printerCut(true); // flush copia 1
    await imprimirCopia('- Ticket Interno -');
    await printerCut(true); // flush copia 2
    return { ok: true, message: 'Tickets de paquetería impresos.' };
  } catch (err: any) {
    return { ok: false, message: `Error al imprimir: ${err?.message ?? err}` };
  }
}

