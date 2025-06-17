import bwipjs from 'bwip-js';
import React from 'react';

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

interface ExportCSVProps {
  data: any[];
  fileName: string;
}

const ExportCSV: React.FC<ExportCSVProps> = ({ data, fileName }) => {
  const downloadCSV = () => {
    const csvString = [
      ["Fecha", "Categoria", "Descripcion", "Total"],
      ...data.map(item => [item.fecha, item.categoria, item.descripcion, item.total])
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'download.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return <button onClick={downloadCSV} 
                  className="text-sm bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Descargar ventas del dia
                    </button>;
};

export default ExportCSV;