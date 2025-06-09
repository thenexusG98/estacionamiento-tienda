// src/components/Productos.tsx
import { useState } from 'react';

type Producto = {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
};

export default function Productos() {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [idCounter, setIdCounter] = useState(1);

  const handleAgregar = () => {
    if (!nombre || precio <= 0 || stock < 0) return;

    const nuevoProducto: Producto = {
      id: idCounter,
      nombre,
      precio,
      stock,
    };

    setProductos([...productos, nuevoProducto]);
    setIdCounter(idCounter + 1);
    setNombre('');
    setPrecio(0);
    setStock(0);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Registrar Nuevo Producto</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="Nombre del producto"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="border px-4 py-2 rounded"
        />
        <input
          type="number"
          placeholder="Precio"
          value={precio}
          onChange={(e) => setPrecio(Number(e.target.value))}
          className="border px-4 py-2 rounded"
        />
        <input
          type="number"
          placeholder="Stock inicial"
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          className="border px-4 py-2 rounded"
        />
      </div>

      <button
        onClick={handleAgregar}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded mb-6"
      >
        Agregar Producto
      </button>

      {productos.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded shadow">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border text-left">ID</th>
                <th className="py-2 px-4 border text-left">Nombre</th>
                <th className="py-2 px-4 border text-left">Precio</th>
                <th className="py-2 px-4 border text-left">Stock</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((prod) => (
                <tr key={prod.id}>
                  <td className="py-2 px-4 border">{prod.id}</td>
                  <td className="py-2 px-4 border">{prod.nombre}</td>
                  <td className="py-2 px-4 border">${prod.precio}</td>
                  <td className="py-2 px-4 border">{prod.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
