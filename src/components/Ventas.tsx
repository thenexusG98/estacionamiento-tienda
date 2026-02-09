// src/components/Ventas.tsx
import { useEffect, useState, useRef } from 'react';
import { FaPlus, FaTrashAlt, FaShoppingCart, FaCheck, FaDollarSign, FaBox } from 'react-icons/fa';
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
  const [successMessage, setSuccessMessage] = useState('');

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
      setProductoSeleccionadoId(null);
      setCantidad(1);

      // Recargar productos
      const nuevosProductos = await obtenerProductos();
      setProductos(nuevosProductos);

      // Mostrar mensaje de éxito
      setSuccessMessage('✅ ¡Venta registrada correctamente!');
      setTimeout(() => setSuccessMessage(''), 3000);

      // Mostrar alerta de venta finalizada
      alert(`✅ ¡VENTA FINALIZADA EXITOSAMENTE!\n\n📊 Detalles:\n• Venta ID: #${ventaId}\n• Total: $${totalVenta.toFixed(2)}\n• Productos: ${itemsVenta.length}\n• Fecha: ${fecha}\n\n¡Gracias por la compra!`);

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
  const productoSeleccionado = productos.find(p => p.id === productoSeleccionadoId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 lg:p-8">
      {/* Encabezado */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-600 p-3 rounded-lg">
            <FaShoppingCart className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">Registrar Venta</h1>
            <p className="text-gray-600 text-sm mt-1">Completa una nueva venta de productos</p>
          </div>
        </div>
      </div>

      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-slideDown">
          <FaCheck className="text-green-600 text-lg" />
          <p className="text-green-700 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Contenedor principal con dos columnas */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Columna izquierda - Formulario de venta */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card de selección de producto */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaBox className="text-lg" />
                Agregar Productos
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Selector de producto */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Selecciona un Producto</label>
                <select
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition-colors bg-gray-50"
                  onChange={(e) => setProductoSeleccionadoId(Number(e.target.value) || null)}
                  value={productoSeleccionadoId || ''}
                >
                  <option value="">-- Selecciona un producto --</option>
                  {productos.map((producto) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre} - ${producto.precio.toFixed(2)} (Stock: {producto.stock})
                    </option>
                  ))}
                </select>
              </div>

              {/* Información del producto seleccionado */}
              {productoSeleccionado && (
                <div className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded">
                  <p className="text-sm text-gray-700"><span className="font-semibold">Producto:</span> {productoSeleccionado.nombre}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Precio:</span> <span className="text-green-600 font-bold">${productoSeleccionado.precio.toFixed(2)}</span></p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Stock Disponible:</span> <span className={productoSeleccionado.stock <= 5 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>{productoSeleccionado.stock} unidades</span></p>
                </div>
              )}

              {/* Cantidad */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cantidad</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition-colors bg-gray-50"
                  min={1}
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                />
              </div>

              {/* Botón agregar */}
              <button
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"
                onClick={agregarProducto}
                disabled={!productoSeleccionadoId}
              >
                <FaPlus className="text-lg" />
                Agregar a Carrito
              </button>
            </div>
          </div>

          {/* Card de carrito */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaShoppingCart className="text-lg" />
                Carrito de Venta ({itemsVenta.length})
              </h2>
            </div>

            {itemsVenta.length === 0 ? (
              <div className="p-12 text-center">
                <FaShoppingCart className="text-5xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No hay productos en el carrito</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
                      <th className="py-4 px-6 text-left text-sm font-bold text-gray-700">Producto</th>
                      <th className="py-4 px-6 text-left text-sm font-bold text-gray-700">Precio</th>
                      <th className="py-4 px-6 text-left text-sm font-bold text-gray-700">Cantidad</th>
                      <th className="py-4 px-6 text-left text-sm font-bold text-gray-700">Total</th>
                      <th className="py-4 px-6 text-center text-sm font-bold text-gray-700">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsVenta.map((item, index) => (
                      <tr
                        key={index}
                        className={`border-b transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } hover:bg-blue-50`}
                      >
                        <td className="py-4 px-6 text-sm font-medium text-gray-800">{item.producto.nombre}</td>
                        <td className="py-4 px-6 text-sm text-green-600 font-semibold">${item.producto.precio.toFixed(2)}</td>
                        <td className="py-4 px-6 text-sm font-semibold text-gray-700">{item.cantidad}</td>
                        <td className="py-4 px-6 text-sm font-bold text-gray-800">
                          ${(item.producto.precio * item.cantidad).toFixed(2)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => eliminarItem(index)}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all hover:scale-110"
                            title="Eliminar producto"
                          >
                            <FaTrashAlt />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha - Resumen y finalizar */}
        <div>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 sticky top-6">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaDollarSign className="text-lg" />
                Resumen de Venta
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Estadísticas */}
              <div className="space-y-3 pb-4 border-b border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Productos:</span>
                  <span className="font-bold text-blue-600">{itemsVenta.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Cantidad Total:</span>
                  <span className="font-bold text-blue-600">{itemsVenta.reduce((sum, item) => sum + item.cantidad, 0)} unidades</span>
                </div>
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Total a Pagar:</span>
                  <span className="text-3xl font-bold text-green-600">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Botón finalizar */}
              <button 
                onClick={finalizarVenta}
                disabled={procesando || itemsVenta.length === 0}
                className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all transform ${
                  procesando || itemsVenta.length === 0
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:scale-105 shadow-lg'
                }`}
              >
                {procesando ? (
                  <>
                    <div className="animate-spin">
                      <FaShoppingCart />
                    </div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <FaCheck className="text-lg" />
                    Finalizar Venta
                  </>
                )}
              </button>

              {/* Info de ayuda */}
              {itemsVenta.length === 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  💡 Agrega productos al carrito para continuar
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
