import { useEffect, useState } from 'react';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { obtenerProductos, actualizarProducto, eliminarProducto } from '../lib/db';

type Producto = {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
};

export default function Inventario() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editPrecio, setEditPrecio] = useState(0);
  const [editStock, setEditStock] = useState(0);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    const data = await obtenerProductos();
    setProductos(data);
  };

  const comenzarEdicion = (producto: Producto) => {
    setEditandoId(producto.id);
    setEditNombre(producto.nombre);
    setEditPrecio(producto.precio);
    setEditStock(producto.stock);
  };

  const comenzarEliminacion = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await eliminarProducto(id); // Asumiendo que la eliminación se maneja con un precio y stock a 0
        alert('Producto eliminado correctamente ✅');
        await cargarProductos();
      } catch (err) {
        alert('Ocurrió un error al eliminar el producto.');
        console.error(err);
      }
    }
  };

  const guardarEdicion = async () => {
    if (editandoId !== null) {
      await actualizarProducto(editandoId, editNombre, editPrecio, editStock);
      setEditandoId(null);
      await cargarProductos();
    }
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Inventario</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 border text-left">ID</th>
              <th className="py-2 px-4 border text-left">Producto</th>
              <th className="py-2 px-4 border text-left">Precio</th>
              <th className="py-2 px-4 border text-left">Stock</th>
              <th className="py-2 px-4 border text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id}>
                <td className="py-2 px-4 border">{p.id}</td>
                <td className="py-2 px-4 border">
                  {editandoId === p.id ? (
                    <input
                      className="border px-2 py-1 rounded w-full"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                    />
                  ) : (
                    p.nombre
                  )}
                </td>
                <td className="py-2 px-4 border">
                  {editandoId === p.id ? (
                    <input
                      type="number"
                      className="border px-2 py-1 rounded w-full"
                      value={editPrecio}
                      onChange={(e) => setEditPrecio(Number(e.target.value))}
                    />
                  ) : (
                    `$${p.precio}`
                  )}
                </td>
                <td className="py-2 px-4 border">
                  {editandoId === p.id ? (
                    <input
                      type="number"
                      className="border px-2 py-1 rounded w-full"
                      value={editStock}
                      onChange={(e) => setEditStock(Number(e.target.value))}
                    />
                  ) : (
                    p.stock
                  )}
                </td>
                <td className="py-2 px-4 border ">
                  {editandoId === p.id ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={guardarEdicion}
                        className="text-green-600 hover:underline"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={cancelarEdicion}
                        className="text-gray-600 hover:underline"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-4">
                      <button
                        onClick={() => comenzarEdicion(p)}
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        <FaEdit className="mr-1" /> Editar
                      </button>
                      <button
                        onClick={() => comenzarEliminacion(p.id)}
                        className="text-red-600 hover:underline flex items-center"
                      >
                        <FaTrashAlt className="mr-1" /> Eliminar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
