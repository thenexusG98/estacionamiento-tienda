import bwipjs from "bwip-js";
import React from "react";

export async function generarCodigoBarrasBase64(
  valor: string
): Promise<string> {
  const canvas = document.createElement("canvas");

  try {
    bwipjs.toCanvas(canvas, {
      bcid: "code128", // tipo de código de barras
      text: valor, // el texto a codificar
      scale: 2, // escala (resolución)
      height: 10, // alto en mm
      includetext: true, // mostrar texto
      textxalign: "center", // centrar texto
    });

    return canvas.toDataURL("image/png");
  } catch (err) {
    console.error("Error al generar código de barras:", err);
    throw err;
  }
}

interface ExportCSVProps {
  data: {
    fecha: string;
    categoria: string;
    descripcion: string;
    total: number;
  }[];
  fileName?: string;
  bottonName?: string;
}

const ExportCSV: React.FC<ExportCSVProps> = ({ data, fileName, bottonName }) => {
  const bottonLabel = bottonName || "Descargar CSV";
  const downloadCSV = () => {
    const encabezado = ["Fecha", "Categoria", "Descripcion", "Total"];
    const filas = data.map((item) => [
      item.fecha,
      item.categoria,
      item.descripcion,
      (item.total ?? 0).toFixed(2), // <- Maneja valores null/undefined
    ]);
    // Calcular total general
    const totalGeneral = data.reduce(
      (suma, item) => suma + (item.total ?? 0),
      0
    );

    // Fila de total final
    const filaTotal = ["", "", "TOTAL GENERAL", totalGeneral.toFixed(2)];

    const csvString = [encabezado, ...filas, filaTotal]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || "download.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={downloadCSV}
      className="text-sm bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
    >
      {bottonLabel}
    </button>
  );
};

export default ExportCSV;
