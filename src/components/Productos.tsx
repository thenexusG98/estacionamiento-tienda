// src/components/Productos.tsx
import { useState, useEffect } from 'react';
import { registrarProducto } from '../lib/db';
import { FaBox, FaTag, FaDollarSign, FaBarcode, FaPlus, FaCheck } from 'react-icons/fa';

export default function Productos() {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleAgregar = async () => {
    if (!nombre.trim()) {
      alert('Por favor ingresa el nombre del producto');
      return;
    }
    if (precio <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }
    if (stock < 0) {
      alert('El stock no puede ser negativo');
      return;
    }

    setLoading(true);
    try {
      await registrarProducto(nombre, precio, stock);
      setSuccessMessage('✅ Producto registrado correctamente');
      setNombre('');
      setPrecio(0);
      setStock(0);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      alert('Ocurrió un error al registrar el producto.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAgregar();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 lg:p-8">
      {/* Encabezado */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-600 p-3 rounded-lg">
            <FaBox className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">Gestión de Productos</h1>
            <p className="text-gray-600 text-sm mt-1">Registra nuevos productos al inventario del sistema</p>
          </div>
        </div>
      </div>

      {/* Card Principal */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        {/* Header del Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaPlus className="text-lg" />
            Registrar Nuevo Producto
          </h2>
          <p className="text-blue-100 text-sm mt-1">Completa el formulario para agregar un nuevo producto al inventario</p>
        </div>

        {/* Contenido del formulario */}
        <div className="p-8">
          {/* Mensaje de éxito */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-slideDown">
              <FaCheck className="text-green-600 text-lg" />
              <p className="text-green-700 font-medium">{successMessage}</p>
            </div>
          )}

          {/* Grid de inputs */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            
            {/* Campo Nombre */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FaBarcode className="text-blue-600" />
                Nombre del Producto
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ej: Botella de agua"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition-colors bg-gray-50 hover:bg-white"
              />
              <p className="text-xs text-gray-500">Nombre descriptivo del producto</p>
            </div>

            {/* Campo Precio */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FaDollarSign className="text-green-600" />
                Precio Unitario
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500 font-semibold">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={precio}
                  onChange={(e) => setPrecio(Number(e.target.value))}
                  onKeyPress={handleKeyPress}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition-colors bg-gray-50 hover:bg-white"
                />
              </div>
              <p className="text-xs text-gray-500">Precio en pesos mexicanos</p>
            </div>

            {/* Campo Stock */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FaTag className="text-orange-600" />
                Stock Inicial
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                onKeyPress={handleKeyPress}
                placeholder="0"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition-colors bg-gray-50 hover:bg-white"
              />
              <p className="text-xs text-gray-500">Cantidad disponible</p>
            </div>

          </div>

          {/* Información de ayuda */}
          <div className="grid md:grid-cols-3 gap-4 mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white text-sm font-bold">1</div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Nombre Único</p>
                <p className="text-xs text-gray-600">Cada producto debe tener un nombre único</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white text-sm font-bold">2</div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Precio Positivo</p>
                <p className="text-xs text-gray-600">El precio debe ser mayor a $0</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white text-sm font-bold">3</div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Stock Válido</p>
                <p className="text-xs text-gray-600">Cantidad inicial de unidades disponibles</p>
              </div>
            </div>
          </div>

          {/* Botón de acción */}
          <div className="flex gap-4">
            <button
              onClick={handleAgregar}
              disabled={loading}
              className="flex-1 md:flex-none bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaPlus className="text-lg" />
              {loading ? 'Registrando...' : 'Registrar Producto'}
            </button>
          </div>
        </div>
      </div>

      {/* Footer informativo */}
      <div className="mt-8 p-4 bg-blue-100 rounded-lg border border-blue-300 text-center">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">💡 Consejo:</span> Presiona <kbd className="bg-white px-2 py-1 rounded text-xs font-mono border border-blue-300 ml-1">Enter</kbd> para registrar rápidamente
        </p>
      </div>
    </div>
  );
}

