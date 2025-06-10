import Database from '@tauri-apps/plugin-sql'

const dbFile = 'sqlite:data.db'; // nombre del archivo en la raíz de almacenamiento de Tauri

export async function getDb() {
    const db = await Database.load(dbFile);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto TEXT,
      cantidad INTEGER,
      precio_unitario REAL,
      total REAL,
      fecha TEXT
    )
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
  