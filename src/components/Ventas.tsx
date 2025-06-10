// src/components/Ventas.tsx
import { useState } from 'react';
import { FaPlus, FaTrashAlt } from 'react-icons/fa';
import { getDb } from '../lib/db';

type Producto = {
  id: number;
  nombre: string;
  precio: number;
};

type VentaItem = {
  producto: Producto;
  cantidad: number;
};

const productosEjemplo: Producto[] = [
  { id: 1, nombre: 'Pan Blanco', precio: 15 },
  { id: 2, nombre: 'Agua Embotellada', precio: 12 },
  { id: 3, nombre: 'Queso Fresco', precio: 35 },
];

export default function Ventas() {
  const [itemsVenta, setItemsVenta] = useState<VentaItem[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState(1);

  const finalizarVenta = async () => {
    const db = await getDb();

    const fecha = new Date().toISOString();
    const totalVenta = itemsVenta.reduce((sum, item) => sum + item.cantidad * item.producto.precio, 0);

    const ventaId = await db.execute(
        `INSERT INTO ventas_totales (total, fecha) VALUES (?, ?)`,
        [totalVenta, fecha]
    );

    for (const item of itemsVenta) {
        const total = item.cantidad * item.producto.precio;

        await db.execute(
            `INSERT INTO ventas (venta_id, producto, cantidad, precio_unitario, total) VALUES (?, ?, ?, ?, ?)`,
            [ventaId, item.producto.nombre, item.cantidad, item.producto.precio, total]
        );
    }

    alert('Venta registrada ✅');
    setItemsVenta([]);
  };
  

  const agregarProducto = () => {
    if (productoSeleccionado) {
      setItemsVenta((prev) => [
        ...prev,
        {
          producto: productoSeleccionado,
          cantidad,
        },
      ]);
      setCantidad(1);
    }
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
          onChange={(e) => {
            const prod = productosEjemplo.find((p) => p.id === Number(e.target.value));
            setProductoSeleccionado(prod || null);
          }}
        >
          <option value="">Selecciona un producto</option>
          {productosEjemplo.map((producto) => (
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
          disabled={!productoSeleccionado}
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
