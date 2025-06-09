// src/components/Inventario.tsx
import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';

type Producto = {
  id: number;
  nombre: string;
  stock: number;
  precio: number;
};

const productos: Producto[] = [
  { id: 1, nombre: 'Pan Blanco', stock: 23, precio: 15 },
  { id: 2, nombre: 'Agua Embotellada', stock: 45, precio: 12 },
  { id: 3, nombre: 'Queso Fresco', stock: 18, precio: 35 },
  { id: 4, nombre: 'Galletas', stock: 32, precio: 10 },
];

export default function Inventario() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Inventario</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 border text-left">ID</th>
              <th className="py-3 px-4 border text-left">Producto</th>
              <th className="py-3 px-4 border text-left">Stock</th>
              <th className="py-3 px-4 border text-left">Precio</th>
              <th className="py-3 px-4 border text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((prod) => (
              <tr key={prod.id}>
                <td className="py-2 px-4 border">{prod.id}</td>
                <td className="py-2 px-4 border">{prod.nombre}</td>
                <td className="py-2 px-4 border">{prod.stock}</td>
                <td className="py-2 px-4 border">${prod.precio}</td>
                <td className="py-2 px-4 border">
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800">
                      <FaEdit />
                    </button>
                    <button className="text-red-600 hover:text-red-800">
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
