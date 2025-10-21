import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import { generarCodigoBarrasBase64 } from './Functions';
import type { Content } from 'pdfmake/interfaces';

pdfMake.vfs = pdfFonts.vfs;
pdfMake.fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  },
};

import printjs from 'print-js';

interface CreatePdfProps {
    id: string | number; // Asegúrate de que id sea un string o number
    placasFormatted: string; // Placas del vehículo
    //content: any;
    pageSize?: { width: number; height: number };
    pageMargins?: [number, number, number, number];
    info?: {
      title: string;
      author: string;
      subject: string;
      keywords: string;
    };
    styles?: Record<string, any>;
  }
  
  interface CreatePdfPropsPaqueteria {
    id: string | number; // Asegúrate de que id sea un string o number
    content: any;
    pageSize?: { width: number; height: number };
    pageMargins?: [number, number, number, number];
    info?: {
      title: string;
      author: string;
      subject: string;
      keywords: string;
    };
    styles?: Record<string, any>;
  }

  type OutputType = 'print' | 'b64';
  
  
  export const createTicketEstacionamiento = async (
    props: CreatePdfProps, // donde CreatePdfProps incluye `id`
    output: OutputType = 'print'
  ) => {
    const { id, placasFormatted } = props;
    const barcodeBase64 = await generarCodigoBarrasBase64(id.toString());
    try {
    
      const docDefinition: TDocumentDefinitions = {
        pageSize: {
            width: 100,
            height: 'auto', // prueba con este valor fijo
          },
          pageMargins: [0, 0, 0, 0],
          content: [
            {
              text: 'TICKET DE ESTACIONAMIENTO',
              alignment: 'center',
              fontSize: 9,
              bold: true,
              margin: [0, 0, 0, 0],
            },
            {
              text: `${new Date().toLocaleString()}`,
              alignment: 'center',
              fontSize: 7,
            },
            {
                text: `Id: ${id}`,
                alignment: 'center',
                fontSize: 7,
            },
            {
                text: `Placas: ${placasFormatted}`,
                alignment: 'center',
                fontSize: 7,
            },
            {
                image: barcodeBase64,
                width: 70,
                alignment: 'center',
                margin: [0, 10, 0, 10],
              } ,
            {
              text: 'Gracias por su visita',
              alignment: 'center',
              fontSize: 9,
              margin: [0, 0, 0, 0],
            },
          ],
          styles: { 
            header: { fontSize: 10, bold: true, alignment: 'center' },
            tHeaderValue: { fontSize: 9, alignment: 'center' },
            tHeaderLabel: { fontSize: 8, alignment: 'center' },
            barcode: { alignment: 'center', margin: [0, 10, 0, 10] },
            text: { fontSize: 8, alignment: 'center' },
        },
      };
  
      const pdfDoc = pdfMake.createPdf(docDefinition);
  
      if (output === 'b64') {
        return new Promise((resolve) => {
          pdfDoc.getBase64((data) => {
            resolve({
              success: true,
              content: data,
              message: 'Archivo generado como base64.',
            });
          });
        });
      }
  
      if (output === 'print') {
        return new Promise((resolve) => {
          pdfDoc.getBase64((data) => {
            printjs({
              printable: data,
              type: 'pdf',
              base64: true,
            });
            resolve({
              success: true,
              content: null,
              message: 'Documento enviado a impresión.',
            });
          });
        });
      }
  
      return {
        success: false,
        content: null,
        message: 'Tipo de salida inválido.',
      };
    } catch (error) {
      console.error('Error en createPdf:', error);
      return {
        success: false,
        content: null,
        message: 'No se pudo generar el documento.',
      };
    }
  };

  
  export const createPdf = async (
    props: CreatePdfPropsPaqueteria, // donde CreatePdfProps incluye `id`
    output: OutputType = 'print'
  ) => {
    const { content } = props;
    try {
    
      const docDefinition: TDocumentDefinitions = {
        pageSize: {
            width: 100,
            height: 'auto', // prueba con este valor fijo
          },
          pageMargins: [0, 0, 0, 0],
          content: content,
          styles: { 
            header: { fontSize: 10, bold: true, alignment: 'center' },
            tHeaderValue: { fontSize: 9, alignment: 'center' },
            tHeaderLabel: { fontSize: 8, alignment: 'center' },
            barcode: { alignment: 'center', margin: [0, 10, 0, 10] },
            text: { fontSize: 8, alignment: 'center' },
        },
      };
  
      const pdfDoc = pdfMake.createPdf(docDefinition);
  
      if (output === 'b64') {
        return new Promise((resolve) => {
          pdfDoc.getBase64((data) => {
            resolve({
              success: true,
              content: data,
              message: 'Archivo generado como base64.',
            });
          });
        });
      }
  
      if (output === 'print') {
        return new Promise((resolve) => {
          pdfDoc.getBase64((data) => {
            printjs({
              printable: data,
              type: 'pdf',
              base64: true,
            });
            resolve({
              success: true,
              content: null,
              message: 'Documento enviado a impresión.',
            });
          });
        });
      }
  
      return {
        success: false,
        content: null,
        message: 'Tipo de salida inválido.',
      };
    } catch (error) {
      console.error('Error en createPdf:', error);
      return {
        success: false,
        content: null,
        message: 'No se pudo generar el documento.',
      };
    }
  };
  

 export const createPdfPaqueteria = async (
  props: { id: number; },
  output: OutputType = 'print'
): Promise<{ success: boolean; content: string | null; message: string }> => {
  const { id } = props;
  const barcodeBase64 = await generarCodigoBarrasBase64(id.toString());

  const ticketBase = (titulo: string): Content[] => [
  {
    text: titulo,
    alignment: 'center',
    fontSize: 9,
    bold: true,
  },
  {
    text: `Fecha: ${new Date().toLocaleString()}`,
    alignment: 'center',
    fontSize: 7,
  },
  {
    text: `Id: ${id}`,
    alignment: 'center',
    fontSize: 7,
  },
  {
    image: barcodeBase64,
    width: 70,
    alignment: 'center',
    margin: [0, 10, 0, 10],
  },
  {
    text: 'Gracias por su preferencia',
    alignment: 'center',
    fontSize: 8,
  },
  {
    text: '\n\n\n', // espacio entre tickets
    fontSize: 6,
  },
];

const docDefinition: TDocumentDefinitions = {
  pageSize: {
    width: 100,
    height: 'auto',
  },
  pageMargins: [0, 0, 0, 0],
  content: [
    ...(ticketBase('Ticket para Cliente') as Content[]),
    ...(ticketBase('Ticket Interno') as Content[]),
  ],
  styles: {
    header: { fontSize: 10, bold: true, alignment: 'center' },
    tHeaderValue: { fontSize: 9, alignment: 'center' },
    tHeaderLabel: { fontSize: 8, alignment: 'center' },
    barcode: { alignment: 'center', margin: [0, 10, 0, 10] },
    text: { fontSize: 8, alignment: 'center' },
  },
};

  const pdfDoc = pdfMake.createPdf(docDefinition);

  if (output === 'print') {
    return new Promise((resolve) => {
      pdfDoc.getBase64((data) => {
        printjs({ printable: data, type: 'pdf', base64: true });
        resolve({ success: true, content: null, message: 'Impreso.' });
      });
    });
  }

  return new Promise((resolve) => {
    pdfDoc.getBase64((data) => {
      resolve({
        success: true,
        content: data,
        message: 'Base64 generado correctamente',
      });
    });
  });
};
  //export default createTicketEstacionamiento;