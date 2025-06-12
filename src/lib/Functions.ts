import { writeTextFile, RemoveOptions, remove } from '@tauri-apps/plugin-fs';
import { Command } from '@tauri-apps/plugin-shell';
import { join, appDataDir } from '@tauri-apps/api/path';

export async function imprimirTicketDesdeFrontend(id: number) {
  const fecha = new Date().toLocaleString();

  const ESC = '\x1B';
  const GS = '\x1D';

  let contenido = '';
  contenido += `${ESC}@`; // Reset
  contenido += `${ESC}a1`; // Center
  contenido += `TICKET ESTACIONAMIENTO\n`;
  contenido += `${ESC}a0`; // Left
  contenido += `Entrada: ${fecha}\n`;
  contenido += `ID: ${id}\n\n`;

  // Código de barras (sencillo - CODE39)
  contenido += `${GS}H2`; // mostrar texto
  contenido += `${GS}w3`;
  contenido += `${GS}k`;   // Barcode
  contenido += String.fromCharCode(4); // 4 = Code39
  contenido += `${id}\0`;

  contenido += `\nGracias por su visita\n`;
  contenido += `${ESC}d3`;
  contenido += `${ESC}m`; // Corte

  // Guardar archivo temporal
 const appDataDirPath = await appDataDir()
  const path = await join(appDataDirPath, `ticket_${id}.txt`);
  await writeTextFile(path, contenido);

  // Enviar a imprimir usando el comando de sistema
  Command.create('print_ticket', [
    '/C',
    `print /D:default ${path}`
  ]).execute();

  await remove(path, { recursive: true } as RemoveOptions);
}
