import bwipjs from 'bwip-js';

export async function generarCodigoBarrasBase64(valor: string): Promise<string> {
  const canvas = document.createElement('canvas');

  try {
    bwipjs.toCanvas(canvas, {
      bcid: 'code128',       // tipo de código de barras
      text: valor,           // el texto a codificar
      scale: 2,              // escala (resolución)
      height: 10,            // alto en mm
      includetext: true,     // mostrar texto
      textxalign: 'center',  // centrar texto
    });

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Error al generar código de barras:', err);
    throw err;
  }
}
