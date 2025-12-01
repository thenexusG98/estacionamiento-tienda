// src/components/Ventas.tsx
import { useEffect, useState } from 'react';
import { FaPlus, FaTrashAlt } from 'react-icons/fa';
import { getDb, obtenerProductos, getUsuarioSesion } from '../lib/db';
import { logger, LogCategory } from '../lib/Logger';

// Función helper para obtener fecha local
function obtenerFechaLocal(): string {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

type Producto = {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
};

type VentaItem = {
  producto: Producto;
  cantidad: number;
};

export default function Ventas() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [itemsVenta, setItemsVenta] = useState<VentaItem[]>([]);
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const data = await obtenerProductos();
        setProductos(data);
      } catch (error) {
        logger.error(
          LogCategory.VENTAS,
          'Error al cargar productos en módulo de ventas',
          {},
          error instanceof Error ? error : undefined
        );
        console.error('Error al cargar productos:', error);
      }
    };
    cargarProductos();
  }, []);

  const finalizarVenta = async () => {
    // Validar que no haya una venta en proceso
    if (procesando) {
      console.log('Venta ya en proceso, ignorando click adicional');
      return;
    }

    if (itemsVenta.length === 0) {
      alert('No hay productos agregados a la venta.');
      return;
    }

    // Marcar como procesando INMEDIATAMENTE
    setProcesando(true);

    try {
      const db = await getDb();
      const fecha = obtenerFechaLocal();
      const totalVenta = itemsVenta.reduce((sum, item) => sum + item.cantidad * item.producto.precio, 0);

      // Obtener usuario en sesión
      const usuario = getUsuarioSesion();

      logger.info(
        LogCategory.VENTAS,
        `Iniciando registro de venta - Total: $${totalVenta}`,
        {
          total: totalVenta,
          productos: itemsVenta.length,
          usuario: usuario?.nombre || 'Sin sesión',
          items: itemsVenta.map(item => ({
            producto: item.producto.nombre,
            cantidad: item.cantidad,
            precio: item.producto.precio
          }))
        }
      );

      const result = await db.execute(
        `INSERT INTO ventas_totales (total, fecha, usuario_id, usuario_nombre) VALUES (?, ?, ?, ?)`,
        [totalVenta, fecha, usuario?.id || null, usuario?.nombre || null]
      );

      const ventaId = result.lastInsertId;

      // Validar que se obtuvo un ID válido
      if (!ventaId || ventaId === 0) {
        logger.error(
          LogCategory.VENTAS,
          'Error al generar ID de venta - ID inválido',
          { ventaId, total: totalVenta }
        );
        throw new Error('Error al generar ID de venta');
      }

      for (const item of itemsVenta) {
        const total = item.cantidad * item.producto.precio;
      
        // Insertar detalle de venta
        await db.execute(
          `INSERT INTO ventas (venta_id, producto, cantidad, precio_unitario, total, usuario_id, usuario_nombre)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [ventaId, item.producto.nombre, item.cantidad, item.producto.precio, total, usuario?.id || null, usuario?.nombre || null]
        );
      
        // Descontar stock
        await db.execute(
          `UPDATE productos SET stock = stock - ? WHERE id = ?`,
          [item.cantidad, item.producto.id]
        );
      }

      logger.info(
        LogCategory.VENTAS,
        `✅ Venta registrada exitosamente`,
        {
          ventaId,
          total: totalVenta,
          productosVendidos: itemsVenta.length,
          fecha
        }
      );

      // Limpiar items ANTES del alert
      setItemsVenta([]);

      // Recargar productos
      const nuevosProductos = await obtenerProductos();
      setProductos(nuevosProductos);

      // Mostrar mensaje de éxito
      alert('Venta registrada ✅');

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      
      logger.error(
        LogCategory.VENTAS,
        `❌ Error al registrar venta: ${errorMsg}`,
        {
          productosIntentados: itemsVenta.length,
          totalIntentado: itemsVenta.reduce((sum, item) => sum + item.cantidad * item.producto.precio, 0)
        },
        error instanceof Error ? error : undefined
      );

      console.error('Error al finalizar venta:', error);
      alert(`Error al registrar la venta: ${errorMsg}`);
    } finally {
      // SIEMPRE desmarcar procesando
      setProcesando(false);
    }
  };

  const agregarProducto = () => {
    const producto = productos.find((p) => p.id === productoSeleccionadoId);
    if (!producto) return;
  
    if (cantidad > producto.stock) {
      alert(`Solo hay ${producto.stock} unidades disponibles de "${producto.nombre}".`);
      return;
    }

    setItemsVenta((prev) => [
      ...prev,
      {
        producto,
        cantidad,
      },
    ]);
    setCantidad(1);
  };

  const eliminarItem = (index: number) => {
    setItemsVenta((prev) => prev.filter((_, i) => i !== index));
  };

  const total = itemsVenta.reduce((sum, item) => sum + item.producto.precio * item.cantidad, 0);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Registrar Venta</h2>

      {/* Selector de productos */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <select
          className="w-full md:w-1/3 px-4 py-2 border rounded"
          onChange={(e) => setProductoSeleccionadoId(Number(e.target.value))}
          value={productoSeleccionadoId || ''}
        >
          <option value="">Selecciona un producto</option>
          {productos.map((producto) => (
            <option key={producto.id} value={producto.id}>
              {producto.nombre} - ${producto.precio}
            </option>
          ))}
        </select>

        <input
          type="number"
          className="w-full md:w-1/4 px-4 py-2 border rounded"
          min={1}
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
        />

        <button
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={agregarProducto}
          disabled={!productoSeleccionadoId}
        >
          <FaPlus className="mr-2" />
          Agregar
        </button>
      </div>

      {/* Tabla de productos agregados */}
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full bg-white border rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border">Producto</th>
              <th className="py-2 px-4 border">Precio</th>
              <th className="py-2 px-4 border">Cantidad</th>
              <th className="py-2 px-4 border">Total</th>
              <th className="py-2 px-4 border">Acción</th>
            </tr>
          </thead>
          <tbody>
            {itemsVenta.map((item, index) => (
              <tr key={index}>
                <td className="py-2 px-4 border">{item.producto.nombre}</td>
                <td className="py-2 px-4 border">${item.producto.precio}</td>
                <td className="py-2 px-4 border">{item.cantidad}</td>
                <td className="py-2 px-4 border">
                  ${item.producto.precio * item.cantidad}
                </td>
                <td className="py-2 px-4 border text-center">
                  <button
                    onClick={() => eliminarItem(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FaTrashAlt />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total y botón de finalizar */}
      <div className="flex justify-between items-center">
        <p className="text-xl font-semibold">Total: ${total}</p>
        <button 
          onClick={finalizarVenta}
          disabled={procesando || itemsVenta.length === 0}
          className={`px-6 py-2 rounded font-semibold transition-all ${
            procesando || itemsVenta.length === 0
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {procesando ? 'Procesando...' : 'Finalizar Venta'}
        </button>
      </div>
    </div>
  );
}
