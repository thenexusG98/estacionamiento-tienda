import { useEffect, useState } from 'react';
import { FaEdit, FaTrashAlt, FaBox, FaSearch, FaCheck, FaTimes } from 'react-icons/fa';
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
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const data = await obtenerProductos();
      setProductos(data);
    } finally {
      setLoading(false);
    }
  };

  const comenzarEdicion = (producto: Producto) => {
    setEditandoId(producto.id);
    setEditNombre(producto.nombre);
    setEditPrecio(producto.precio);
    setEditStock(producto.stock);
  };

  const comenzarEliminacion = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
      try {
        await eliminarProducto(id);
        setSuccessMessage('✅ Producto eliminado correctamente');
        setTimeout(() => setSuccessMessage(''), 3000);
        await cargarProductos();
      } catch (err) {
        alert('Ocurrió un error al eliminar el producto.');
        console.error(err);
      }
    }
  };

  const guardarEdicion = async () => {
    if (editandoId !== null) {
      if (!editNombre.trim() || editPrecio <= 0 || editStock < 0) {
        alert('Por favor verifica los datos del producto');
        return;
      }
      try {
        await actualizarProducto(editandoId, editNombre, editPrecio, editStock);
        setSuccessMessage('✅ Producto actualizado correctamente');
        setTimeout(() => setSuccessMessage(''), 3000);
        setEditandoId(null);
        await cargarProductos();
      } catch (err) {
        alert('Error al guardar los cambios');
        console.error(err);
      }
    }
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
  };

  // Filtrar productos por búsqueda
  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.id.toString().includes(busqueda)
  );

  const totalValor = productos.reduce((sum, p) => sum + (p.precio * p.stock), 0);
  const stockBajo = productos.filter(p => p.stock <= 5).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 lg:p-8">
      {/* Encabezado */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-600 p-3 rounded-lg">
            <FaBox className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">Gestión de Inventario</h1>
            <p className="text-gray-600 text-sm mt-1">Visualiza y edita los productos registrados en el sistema</p>
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

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-600">
          <p className="text-gray-600 text-sm font-semibold">Total de Productos</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{productos.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-600">
          <p className="text-gray-600 text-sm font-semibold">Stock Bajo</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{stockBajo}</p>
          <p className="text-xs text-gray-500 mt-1">≤ 5 unidades</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-600">
          <p className="text-gray-600 text-sm font-semibold">Valor Total</p>
          <p className="text-3xl font-bold text-green-600 mt-2">${totalValor.toFixed(2)}</p>
        </div>
      </div>

      {/* Card principal */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        {/* Header del Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaBox className="text-lg" />
            Lista de Productos
          </h2>
        </div>

        {/* Barra de búsqueda */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <FaSearch className="absolute left-4 top-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o ID..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Tabla mejorada */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin">
                <FaBox className="text-4xl text-blue-600" />
              </div>
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <FaBox className="text-5xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay productos disponibles</p>
              <p className="text-gray-400 text-sm">Agrega tu primer producto desde la sección de Productos</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
                  <th className="py-4 px-6 text-left text-sm font-bold text-gray-700">ID</th>
                  <th className="py-4 px-6 text-left text-sm font-bold text-gray-700">Producto</th>
                  <th className="py-4 px-6 text-left text-sm font-bold text-gray-700">Precio</th>
                  <th className="py-4 px-6 text-left text-sm font-bold text-gray-700">Stock</th>
                  <th className="py-4 px-6 text-left text-sm font-bold text-gray-700">Valor Total</th>
                  <th className="py-4 px-6 text-left text-sm font-bold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((p, index) => (
                  <tr
                    key={p.id}
                    className={`border-b transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-blue-50`}
                  >
                    <td className="py-4 px-6 text-sm font-semibold text-gray-700">#{p.id}</td>
                    <td className="py-4 px-6 text-sm">
                      {editandoId === p.id ? (
                        <input
                          className="border-2 border-blue-600 px-3 py-2 rounded-lg w-full focus:outline-none"
                          value={editNombre}
                          onChange={(e) => setEditNombre(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium text-gray-800">{p.nombre}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      {editandoId === p.id ? (
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">$</span>
                          <input
                            type="number"
                            className="border-2 border-blue-600 px-8 py-2 rounded-lg w-full focus:outline-none"
                            value={editPrecio}
                            onChange={(e) => setEditPrecio(Number(e.target.value))}
                            step="0.01"
                          />
                        </div>
                      ) : (
                        <span className="font-semibold text-green-600">${p.precio.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      {editandoId === p.id ? (
                        <input
                          type="number"
                          className="border-2 border-blue-600 px-3 py-2 rounded-lg w-full focus:outline-none"
                          value={editStock}
                          onChange={(e) => setEditStock(Number(e.target.value))}
                        />
                      ) : (
                        <span className={`font-semibold px-3 py-1 rounded-full ${
                          p.stock <= 5
                            ? 'bg-red-100 text-red-700'
                            : p.stock <= 10
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {p.stock} unidades
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm font-semibold text-gray-700">
                      ${(p.precio * p.stock).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      {editandoId === p.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={guardarEdicion}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-medium"
                          >
                            <FaCheck className="text-sm" /> Guardar
                          </button>
                          <button
                            onClick={cancelarEdicion}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-medium"
                          >
                            <FaTimes className="text-sm" /> Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => comenzarEdicion(p)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-1 transition-all font-medium text-sm"
                            title="Editar producto"
                          >
                            <FaEdit className="text-sm" /> Editar
                          </button>
                          <button
                            onClick={() => comenzarEliminacion(p.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center gap-1 transition-all font-medium text-sm"
                            title="Eliminar producto"
                          >
                            <FaTrashAlt className="text-sm" /> Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {productosFiltrados.length > 0 && (
          <div className="p-6 bg-gray-50 border-t border-gray-200 text-right text-sm text-gray-600">
            Mostrando <span className="font-bold text-gray-800">{productosFiltrados.length}</span> de <span className="font-bold text-gray-800">{productos.length}</span> productos
          </div>
        )}
      </div>
    </div>
  );
}
