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

    await db.execute(`
      CREATE TABLE IF NOT EXISTS estacionamiento_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha_hora TEXT NOT NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS baños (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha_hora TEXT NOT NULL,
        monto REAL NOT NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        placas TEXT NOT NULL,
        fecha_entrada TEXT NOT NULL,
        fecha_salida TEXT,
        total REAL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS paqueteria (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha_entrega TEXT NOT NULL,
        fecha_recoleccion TEXT,
        monto REAL
    )
    `);

  return db;
}

export async function registrarEntregaPaquete(fecha_entrega: string) {
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO paqueteria (fecha_entrega) VALUES (?)`,
    [fecha_entrega]
  );
  return result.lastInsertId as number;
}

export async function registrarRecoleccionPaquete(id: number, fecha: string, monto: number) {
  const db = await getDb();
  await db.execute(
    `UPDATE paqueteria SET fecha_recoleccion = ?, monto = ? WHERE id = ?`,
    [fecha, monto, id]
  );
}

export async function obtenerVentas() {
    const db = await getDb();
  
    const rows = await db.select<{
      id: number;
      fecha: string;
      producto: string;
      cantidad: number;
      precio_unitario: number;
      total: number;
    }[]>(`
      SELECT 
        v.id,
        vt.fecha,
        v.producto,
        v.cantidad,
        v.precio_unitario,
        v.total
      FROM ventas v
      JOIN ventas_totales vt ON v.venta_id = vt.id
      ORDER BY vt.fecha DESC
    `);
  
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

  export async function eliminarProducto(id: number) {
    const db = await getDb();
  
    await db.execute(
      `DELETE FROM productos WHERE id = ?`,
      [id]
    );
  }
  
  export async function obtenerProductosMasVendidos(limit = 5) {
    const db = await getDb();
  
    const productos = await db.select<{
      producto: string;
      total_vendido: number;
      cantidad_total: number;
    }[]>(
      `
      SELECT 
        producto,
        SUM(total) AS total_vendido,
        SUM(cantidad) AS cantidad_total
      FROM ventas
      GROUP BY producto
      ORDER BY cantidad_total DESC
      LIMIT ?
      `,
      [limit]
    );
  
    return productos;
  }
  
  export async function obtenerResumenDelDia() {
    const db = await getDb();
  const fecha = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const tickets = await db.select<{ 
    total: number | null,
    transacciones: number | null;
   }[]>(
    `SELECT SUM(total) as total, 
    COUNT(id) AS transacciones
     FROM tickets WHERE DATE(fecha_salida) = ?`, [fecha]
  );
  const baños = await db.select<{ total: number | null,
    transacciones: number | null;
   }[]>(
    `SELECT SUM(monto) as total, 
    COUNT(id) AS transacciones
     FROM baños WHERE fecha_hora = ?`, [fecha]
  );
  const ventas_totales = await db.select<{ total: number | null,
    transacciones: number | null;
   }[]>(
    `SELECT SUM(total) as total, 
    COUNT(id) AS transacciones
     FROM ventas_totales WHERE fecha = ?`, [fecha]
  );

  const totalTickets = tickets[0]?.total || 0;
  const totalBanos = baños[0]?.total || 0;
  const totalVentas = ventas_totales[0]?.total || 0;

  const transaccionTickets = tickets[0]?.transacciones || 0;
  const transaccionBanos = baños[0]?.transacciones || 0;
  const transaccionVentas = ventas_totales[0]?.transacciones || 0;

  return { total: totalTickets + totalBanos + totalVentas, 
            transaccion: transaccionTickets + transaccionBanos + transaccionVentas };
  }
  
  export async function contarProductosBajos(threshold = 5) {
    const db = await getDb();
  
    const [{ cantidad = 0 } = {}] = await db.select<{ cantidad: number }[]>(
      `SELECT COUNT(*) as cantidad FROM productos WHERE stock <= ?`,
      [threshold]
    );
  
    return cantidad;
  }

  export async function registrarBaño(fechaHora: string, monto: number) {
    const db = await getDb();

    await db.execute(
      `INSERT INTO baños (fecha_hora, monto) VALUES (?, ?)`,
      [fechaHora, monto]
    );

    
}

export async function registrarTicketEstacionamiento(fecha_entrada: string, placas: string) {
  const db = await getDb();

  await db.execute(
    `INSERT INTO tickets (fecha_entrada, placas) VALUES (?, ?)`,
    [fecha_entrada, placas]
  );

  const [{ id }] = await db.select<{ id: number }[]>(`SELECT last_insert_rowid() AS id`);
  return id;
}

export async function registrarSalidaTicketEstacionamiento(id: number, fecha_salida: string) {
  const db = await getDb();
  await db.execute(
    `UPDATE tickets 
     SET fecha_salida = ?
     WHERE id = ? AND (total IS NULL OR total = '')`,
    [fecha_salida, id]
  );
 // return id;
}

export async function consultaFechaEntradaTicket(id: number) {
  const db = await getDb();
  const [{ fecha_entrada }] = await db.select<{ fecha_entrada: string }[]>(
    `SELECT fecha_entrada FROM tickets WHERE id = ?`,
    [id]
  );
  return fecha_entrada;
}

export async function registrarPago(idTicket: number, total: number) {
  const db = await getDb();
  const fechaSalida = new Date().toISOString();

  await db.execute(
    `UPDATE tickets SET fecha_salida = ?, total = ? WHERE id = ?`,
    [fechaSalida, total, idTicket]
  );
}

export async function obtenerTicket(id: number): Promise<{
  id: number;
  fecha_entrada: string;
  fecha_salida: string | null;
  total: number | null;
}> {
  const db = await getDb();
  const result = await db.select<any[]>(
    `SELECT id, fecha_entrada, fecha_salida, total FROM tickets WHERE id = ? LIMIT 1`,
    [id]
  );

  return result[0];
}


export async function obtenerTicketsDelDia(fechaDia: string) {
  const db = await getDb();

  const tickets = await db.select<{
    total: number | null;
  }[]>(
    `SELECT SUM(total) as total
     FROM tickets
     WHERE DATE(fecha_salida) = ?`,
    [fechaDia]
  );

  const baños = await db.select<{
    total: number | null;
  }[]>(
    `SELECT SUM(monto) as total 
     FROM baños 
     WHERE DATE(fecha_hora) = ?`,
    [fechaDia]
  );

  const ventas_totales = await db.select<{
    total: number | null;
  }[]>(
    `SELECT SUM(total) as total 
     FROM ventas_totales 
     WHERE DATE(fecha) = ?`,
    [fechaDia]
  );

  const ventaPaqueteria = await db.select<{
    total: number | null;
  }[]>(
    `SELECT SUM(monto) as total
      FROM paqueteria 
      WHERE DATE(fecha_recoleccion) = ?`,
    [fechaDia]
  );

  return {
    tickets: tickets[0].total || 0,
    baños: baños[0].total || 0,
    ventas_totales: ventas_totales[0].total || 0,
    venta_paqueteria: ventaPaqueteria[0].total || 0
  };
}

export async function obtenerVentasPorDia(fecha: string) {
  const db = await getDb();

  const ventasBaños = await db.select<{
    id: number;
    fecha_hora: string;
    monto: number;
  }[]>(
    `SELECT id, fecha_hora, monto FROM baños WHERE fecha_hora = ?`,
    [fecha]
  );

  const ventasEstacionamiento = await db.select<{
    id: number;
    fecha_salida: string;
    placas: string;
    total: number;
  }[]>(
    `SELECT id, DATE(fecha_salida) as fecha_salida, placas, total FROM tickets WHERE DATE(fecha_salida) = ?`,
    [fecha]
  );

  const ventasTienda = await db.select<{
      id: number;
      fecha: string;
      producto: string;
      cantidad: number;
      total: number;
    }[]>(`
      SELECT 
        v.id,
        vt.fecha,
        v.producto,
        v.cantidad,
        v.total
      FROM ventas v
      JOIN ventas_totales vt ON v.venta_id = vt.id
      where vt.fecha = ?
    `, [fecha]);

    const ventasPaqueteria = await db.select<{
      id: number;
      fecha_recoleccion: string;
      monto: number;
    }[]>(`
      SELECT id, DATE(fecha_recoleccion), monto 
      FROM paqueteria 
      WHERE DATE(fecha_recoleccion) = ?`, [fecha]);


  return {baños: ventasBaños, estacionamiento: ventasEstacionamiento, tienda: ventasTienda, paqueteria: ventasPaqueteria};
}