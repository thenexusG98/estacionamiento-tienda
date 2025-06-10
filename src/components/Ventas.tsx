// src/components/Ventas.tsx
import { useEffect, useState } from 'react';
import { FaPlus, FaTrashAlt } from 'react-icons/fa';
import { getDb, obtenerProductos } from '../lib/db';

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

  useEffect(() => {
    const cargarProductos = async () => {
      const data = await obtenerProductos();
      setProductos(data);
    };
    cargarProductos();
  }, []);

  const finalizarVenta = async () => {
    if (itemsVenta.length === 0) {
      alert('No hay productos agregados a la venta.');
      return;
    }

    const db = await getDb();
    const fecha = new Date().toISOString();
    const totalVenta = itemsVenta.reduce((sum, item) => sum + item.cantidad * item.producto.precio, 0);

    await db.execute(
      `INSERT INTO ventas_totales (total, fecha) VALUES (?, ?)`,
      [totalVenta, fecha]
    );

    const [{ id: ventaId }] = await db.select<{ id: number }[]>(
      `SELECT last_insert_rowid() AS id`
    );

    for (const item of itemsVenta) {
      const total = item.cantidad * item.producto.precio;
    
      // Insertar detalle de venta
      await db.execute(
        `INSERT INTO ventas (venta_id, producto, cantidad, precio_unitario, total)
         VALUES (?, ?, ?, ?, ?)`,
        [ventaId, item.producto.nombre, item.cantidad, item.producto.precio, total]
      );
    
      // Descontar stock
      await db.execute(
        `UPDATE productos SET stock = stock - ? WHERE id = ?`,
        [item.cantidad, item.producto.id]
      );
    }

    alert('Venta registrada ✅');
    setItemsVenta([]);

    const nuevosProductos = await obtenerProductos();
    setProductos(nuevosProductos);
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
        <button onClick={finalizarVenta}
         className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
          Finalizar Venta
        </button>
      </div>
    </div>
  );
}
