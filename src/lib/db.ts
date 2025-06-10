import Database from '@tauri-apps/plugin-sql'

const dbFile = 'sqlite:data.db'; // nombre del archivo en la raíz de almacenamiento de Tauri

export async function getDb() {
    const db = await Database.load(dbFile);

    // Tabla principal: resumen por venta
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ventas_totales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total REAL NOT NULL,
        fecha TEXT NOT NULL
      );
    `);

    // Tabla de detalle por producto vendido
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venta_id INTEGER NOT NULL,
        producto TEXT NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_unitario REAL NOT NULL,
        total REAL NOT NULL,
        FOREIGN KEY (venta_id) REFERENCES ventas_totales(id)
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        precio REAL NOT NULL,
        stock INTEGER NOT NULL
      );
    `);

  return db;
}

export async function obtenerVentas() {
    const db = await getDb();
  
    const rows = await db.select<{
      id: number;
      producto: string;
      cantidad: number;
      precio_unitario: number;
      total: number;
      fecha: string;
    }[]>(
      'SELECT id, producto, cantidad, precio_unitario, total, fecha FROM ventas ORDER BY fecha DESC'
    );
  
    return rows;
  }
  
  export async function registrarProducto(nombre: string, precio: number, stock: number) {
    const db = await getDb();
  
    await db.execute(
      `INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)`,
      [nombre, precio, stock]
    );
  }

  export async function obtenerProductos() {
    const db = await getDb();
  
    const productos = await db.select<{
      id: number;
      nombre: string;
      precio: number;
      stock: number;
    }[]>(`SELECT * FROM productos`);
  
    return productos;
  }

  export async function actualizarProducto(id: number, nombre: string, precio: number, stock: number) {
    const db = await getDb();
  
    await db.execute(
      `UPDATE productos SET nombre = ?, precio = ?, stock = ? WHERE id = ?`,
      [nombre, precio, stock, id]
    );
  }
  
  