// src/components/Productos.tsx
import { useState } from 'react';
import { registrarProducto } from '../lib/db';

export default function Productos() {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);

  const handleAgregar = async () => {
    if (!nombre || precio <= 0 || stock < 0) {
      alert('Por favor llena todos los campos correctamente.');
      return;
    }

    try {
      await registrarProducto(nombre, precio, stock);
      alert('Producto registrado correctamente ✅');
      setNombre('');
      setPrecio(0);
      setStock(0);
    } catch (err) {
      alert('Ocurrió un error al registrar el producto.');
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Registrar Nuevo Producto</h2>

      <div className="grid  md:grid-cols-3 gap-6 mb-6">
          
        <div>
          <label className="block text-gray-700 ">Nombre del producto</label>
          <input
            type="text"
            //placeholder="Nombre del producto"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="border px-4 py-2 rounded  w-full"
          />
        </div>
       
        <div>
          <label className="block text-gray-700">Precio</label>
          <input
            type="number"
            placeholder="Precio"
            value={precio}
            onChange={(e) => setPrecio(Number(e.target.value))}
            className="border px-4 py-2 rounded  w-full"
          />
        </div>
        
        <div>
          <label className="block text-gray-700">Stock inicial</label>
          <input
            type="number"
            placeholder="Stock inicial"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            className="border px-4 py-2 rounded  w-full"
          />
        </div>
        
      </div>

      <button
        onClick={handleAgregar}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
      >
        Agregar Producto
      </button>
    </div>
  );
}

