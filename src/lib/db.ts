import Database from '@tauri-apps/plugin-sql'

const dbFile = 'sqlite:data.db'; // nombre del archivo en la raíz de almacenamiento de Tauri

// Variable global para almacenar el usuario actual en sesión
let usuarioEnSesion: { id: number; usuario: string; nombre: string; rol?: string } | null = null;

// Función para establecer el usuario en sesión
export function setUsuarioSesion(usuario: { id: number; usuario: string; nombre: string; rol?: string } | null) {
  usuarioEnSesion = usuario;
}

// Función para obtener el usuario en sesión
export function getUsuarioSesion() {
  return usuarioEnSesion;
}

export async function getDb() {
    const db = await Database.load(dbFile);
    // Tabla principal: resumen por venta
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ventas_totales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total REAL NOT NULL,
      fecha TEXT NOT NULL,
      usuario_id INTEGER,
      usuario_nombre TEXT
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
        usuario_id INTEGER,
        usuario_nombre TEXT,
        FOREIGN KEY (venta_id) REFERENCES ventas_totales(id)
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        precio REAL NOT NULL,
        stock INTEGER NOT NULL,
        usuario_id INTEGER,
        usuario_nombre TEXT
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS estacionamiento_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha_hora TEXT NOT NULL,
        usuario_id INTEGER,
        usuario_nombre TEXT
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS baños (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha_hora TEXT NOT NULL,
        monto REAL NOT NULL,
        usuario_id INTEGER,
        usuario_nombre TEXT
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        placas TEXT NOT NULL,
        fecha_entrada TEXT NOT NULL,
        fecha_salida TEXT,
        total REAL,
        usuario_id INTEGER,
        usuario_nombre TEXT
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS paqueteria (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha_entrega TEXT NOT NULL,
        fecha_recoleccion TEXT,
        monto REAL,
        usuario_id INTEGER,
        usuario_nombre TEXT
    )
    `);

    // Tabla de usuarios para autenticación
    await db.execute(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        nombre_completo TEXT NOT NULL,
        email TEXT,
        rol TEXT NOT NULL DEFAULT 'empleado',
        activo INTEGER NOT NULL DEFAULT 1,
        fecha_creacion TEXT NOT NULL,
        ultimo_acceso TEXT,
        intentos_fallidos INTEGER DEFAULT 0,
        bloqueado_hasta TEXT
      );
    `);

    // Insertar usuario administrador por defecto si no existe
    const adminExists = await db.select<{ count: number }[]>(`
      SELECT COUNT(*) as count FROM usuarios WHERE usuario = 'admin'
    `);
    
    const adminCount = adminExists[0]?.count || 0;
    if (adminCount === 0) {
      await db.execute(`
        INSERT INTO usuarios (usuario, password, nombre_completo, email, rol, fecha_creacion)
        VALUES ('admin', 'admin123', 'Administrador', 'admin@tienda.com', 'admin', ?)
      `, [new Date().toISOString()]);
    }

  return db;
}

export async function registrarEntregaPaquete(fecha_entrega: string) {
  const db = await getDb();
  const usuario = getUsuarioSesion();
  const result = await db.execute(
    `INSERT INTO paqueteria (fecha_entrega, usuario_id, usuario_nombre) VALUES (?, ?, ?)`,
    [fecha_entrega, usuario?.id || null, usuario?.nombre || null]
  );
  return result.lastInsertId as number;
}

export async function registrarRecoleccionPaquete(id: number, fecha: string, monto: number) {
  const db = await getDb();
  const usuario = getUsuarioSesion();
  await db.execute(
    `UPDATE paqueteria SET fecha_recoleccion = ?, monto = ?, usuario_id = ?, usuario_nombre = ? WHERE id = ?`,
    [fecha, monto, usuario?.id || null, usuario?.nombre || null, id]
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
  const usuario = getUsuarioSesion();

  await db.execute(
    `INSERT INTO productos (nombre, precio, stock, usuario_id, usuario_nombre) VALUES (?, ?, ?, ?, ?)`,
    [nombre, precio, stock, usuario?.id || null, usuario?.nombre || null]
  );
}  export async function obtenerProductos() {
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
    const usuario = getUsuarioSesion();
    
    // Si es admin, no filtrar por usuario. Si es empleado, solo mostrar su resumen
    const esAdmin = usuario?.rol === 'admin';
    const usuarioIdFiltro = esAdmin ? null : usuario?.id || null;

  const tickets = await db.select<{ 
    total: number | null,
    transacciones: number | null;
   }[]>(
    `SELECT SUM(total) as total, 
    COUNT(id) AS transacciones
     FROM tickets 
     WHERE DATE(fecha_salida) = ?
     ${!esAdmin ? 'AND usuario_id = ?' : ''}`, 
    esAdmin ? [fecha] : [fecha, usuarioIdFiltro]
  );
  const baños = await db.select<{ total: number | null,
    transacciones: number | null;
   }[]>(
    `SELECT SUM(monto) as total, 
    COUNT(id) AS transacciones
     FROM baños 
     WHERE DATE(fecha_hora) = ?
     ${!esAdmin ? 'AND usuario_id = ?' : ''}`, 
    esAdmin ? [fecha] : [fecha, usuarioIdFiltro]
  );
  const ventas_totales = await db.select<{ total: number | null,
    transacciones: number | null;
   }[]>(
    `SELECT SUM(total) as total, 
    COUNT(id) AS transacciones
     FROM ventas_totales 
     WHERE fecha = ?
     ${!esAdmin ? 'AND usuario_id = ?' : ''}`, 
    esAdmin ? [fecha] : [fecha, usuarioIdFiltro]
  );
  const paqueteria = await db.select<{ total: number | null,
    transacciones: number | null;
   }[]>(
    `SELECT SUM(monto) as total, 
    COUNT(id) AS transacciones
     FROM paqueteria 
     WHERE DATE(fecha_recoleccion) = ?
     ${!esAdmin ? 'AND usuario_id = ?' : ''}`, 
    esAdmin ? [fecha] : [fecha, usuarioIdFiltro]
  );

  const totalTickets = tickets[0]?.total || 0;
  const totalBanos = baños[0]?.total || 0;
  const totalVentas = ventas_totales[0]?.total || 0;
  const totalPaqueteria = paqueteria[0]?.total || 0;

  const transaccionTickets = tickets[0]?.transacciones || 0;
  const transaccionBanos = baños[0]?.transacciones || 0;
  const transaccionVentas = ventas_totales[0]?.transacciones || 0;
  const transaccionPaqueteria = paqueteria[0]?.transacciones || 0;


  return { total: totalTickets + totalBanos + totalVentas + totalPaqueteria, 
            transaccion: transaccionTickets + transaccionBanos + transaccionVentas + transaccionPaqueteria };
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
    const usuario = getUsuarioSesion();

    await db.execute(
      `INSERT INTO baños (fecha_hora, monto, usuario_id, usuario_nombre) VALUES (?, ?, ?, ?)`,
      [fechaHora, monto, usuario?.id || null, usuario?.nombre || null]
    );

    
}

export async function registrarTicketEstacionamiento(fecha_entrada: string, placas: string) {
  const db = await getDb();
  const usuario = getUsuarioSesion();

  await db.execute(
    `INSERT INTO tickets (fecha_entrada, placas, usuario_id, usuario_nombre) VALUES (?, ?, ?, ?)`,
    [fecha_entrada, placas, usuario?.id || null, usuario?.nombre || null]
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

// Obtener tickets pendientes de pago por usuario
export async function obtenerTicketsPendientesPorUsuario(): Promise<{
  id: number;
  placas: string;
  fecha_entrada: string;
  fecha_salida: string | null;
  usuario_nombre: string;
}[]> {
  const db = await getDb();
  const usuario = getUsuarioSesion();
  
  // Si es admin, no filtrar por usuario. Si es empleado, solo mostrar sus tickets
  const esAdmin = usuario?.rol === 'admin';
  const usuarioIdFiltro = esAdmin ? null : usuario?.id || null;

  const query = `
    SELECT id, placas, fecha_entrada, fecha_salida, usuario_nombre
    FROM tickets
    WHERE total IS NULL OR total = ''
    ${!esAdmin ? 'AND usuario_id = ?' : ''}
    ORDER BY fecha_entrada DESC
  `;

  const tickets = await db.select<{
    id: number;
    placas: string;
    fecha_entrada: string;
    fecha_salida: string | null;
    usuario_nombre: string;
  }[]>(query, esAdmin ? [] : [usuarioIdFiltro]);

  return tickets;
}

// Obtener paquetes pendientes de cobro por usuario
export async function obtenerPaquetesPendientesPorUsuario(): Promise<{
  id: number;
  fecha_entrega: string;
  usuario_nombre: string;
}[]> {
  const db = await getDb();
  const usuario = getUsuarioSesion();
  
  // Si es admin, no filtrar por usuario. Si es empleado, solo mostrar sus paquetes
  const esAdmin = usuario?.rol === 'admin';
  const usuarioIdFiltro = esAdmin ? null : usuario?.id || null;

  const query = `
    SELECT id, fecha_entrega, usuario_nombre
    FROM paqueteria
    WHERE monto IS NULL OR monto = ''
    ${!esAdmin ? 'AND usuario_id = ?' : ''}
    ORDER BY fecha_entrega DESC
  `;

  const paquetes = await db.select<{
    id: number;
    fecha_entrega: string;
    usuario_nombre: string;
  }[]>(query, esAdmin ? [] : [usuarioIdFiltro]);

  return paquetes;
}


export async function obtenerTicketsDelDia(fechaDia: string) {
  const db = await getDb();
  const usuario = getUsuarioSesion();
  
  console.log('obtenerTicketsDelDia - Usuario en sesión:', usuario);
  console.log('obtenerTicketsDelDia - Es admin?:', usuario?.rol === 'admin');
  
  // Si es admin, no filtrar por usuario. Si es empleado, solo mostrar sus ventas
  const esAdmin = usuario?.rol === 'admin';
  const usuarioIdFiltro = esAdmin ? null : usuario?.id || null;

  if (esAdmin){
  const tickets = await db.select<{
    total: number | null;
  }[]>(
    `SELECT SUM(total) as total
     FROM tickets
     WHERE DATE(fecha_salida) = ?
     `,
    [fechaDia]
  );

  const baños = await db.select<{
    total: number | null;
  }[]>(
    `SELECT SUM(monto) as total 
     FROM baños 
     WHERE DATE(fecha_hora) = ?
     `,
    [fechaDia]
  );

  const ventas_totales = await db.select<{
    total: number | null;
  }[]>(
    `SELECT SUM(total) as total 
     FROM ventas_totales 
     WHERE DATE(fecha) = ?
     `,
     [fechaDia] 
  );

  const ventaPaqueteria = await db.select<{
    total: number | null;
  }[]>(
    `SELECT SUM(monto) as total
      FROM paqueteria 
      WHERE DATE(fecha_recoleccion) = ?
      `,
     [fechaDia]
  );

  return {
    tickets: tickets[0].total || 0,
    baños: baños[0].total || 0,
    ventas_totales: ventas_totales[0].total || 0,
    venta_paqueteria: ventaPaqueteria[0].total || 0
  };
  }
  const tickets = await db.select<{
    total: number | null;
  }[]>(
    `SELECT SUM(total) as total
     FROM tickets
     WHERE DATE(fecha_salida) = ?
     AND usuario_id = ?`,
    [fechaDia, usuarioIdFiltro]
  );

  const baños = await db.select<{
    total: number | null;
  }[]>(
    `SELECT SUM(monto) as total 
     FROM baños 
     WHERE DATE(fecha_hora) = ?
     AND usuario_id = ?`,
    [fechaDia, usuarioIdFiltro]
  );

  const ventas_totales = await db.select<{
    total: number | null;
  }[]>(
    `SELECT SUM(total) as total 
     FROM ventas_totales 
     WHERE DATE(fecha) = ?
     AND usuario_id = ?`,
    [fechaDia, usuarioIdFiltro]
  );

  const ventaPaqueteria = await db.select<{
    total: number | null;
  }[]>(
    `SELECT SUM(monto) as total
      FROM paqueteria 
      WHERE DATE(fecha_recoleccion) = ?
      AND usuario_id = ?`,
    [fechaDia, usuarioIdFiltro]
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
  const usuario = getUsuarioSesion();
  
  console.log('obtenerVentasPorDia - Usuario en sesión:', usuario);
  console.log('obtenerVentasPorDia - Es admin?:', usuario?.rol === 'admin');
  
  // Si es admin, no filtrar por usuario. Si es empleado, solo mostrar sus ventas
  const esAdmin = usuario?.rol === 'admin';
  const usuarioIdFiltro = esAdmin ? null : usuario?.id || null;

  if (esAdmin){
      const ventasBaños = await db.select<{
      id: number;
      fecha_hora: string;
      monto: number;
    }[]>(
      `SELECT id, fecha_hora, monto FROM baños 
      WHERE DATE(fecha_hora) = ?
      `,
      [fecha]
    );

     const ventasEstacionamiento = await db.select<{
      id: number;
      fecha_salida: string;
      placas: string;
      total: number;
    }[]>(
      `SELECT id, DATE(fecha_salida) as fecha_salida, placas, total
      FROM tickets 
      WHERE DATE(fecha_salida) = ?
      `,
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
      WHERE vt.fecha = ?
    `, [fecha]);

    const ventasPaqueteria = await db.select<{
      id: number;
      fecha_recoleccion: string;
      monto: number;
    }[]>(`
      SELECT id, DATE(fecha_recoleccion) as fecha_recoleccion, monto 
      FROM paqueteria 
      WHERE DATE(fecha_recoleccion) = ?
      `, 
       [fecha]);

  return {baños: ventasBaños, estacionamiento: ventasEstacionamiento, tienda: ventasTienda, paqueteria: ventasPaqueteria};

  }
  const ventasBaños = await db.select<{
    id: number;
    fecha_hora: string;
    monto: number;
  }[]>(
    `SELECT id, fecha_hora, monto FROM baños 
     WHERE DATE(fecha_hora) = ?
     AND usuario_id = ?`,
    [fecha, usuarioIdFiltro]
  );

  const ventasEstacionamiento = await db.select<{
    id: number;
    fecha_salida: string;
    placas: string;
    total: number;
  }[]>(
    `SELECT id, DATE(fecha_salida) as fecha_salida, placas, total
     FROM tickets 
     WHERE DATE(fecha_salida) = ?
     AND usuario_id = ?`,
    [fecha, usuarioIdFiltro]
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
      WHERE vt.fecha = ?
      AND vt.usuario_id = ?
    `, [fecha, usuarioIdFiltro]);

    const ventasPaqueteria = await db.select<{
      id: number;
      fecha_recoleccion: string;
      monto: number;
    }[]>(`
      SELECT id, DATE(fecha_recoleccion) as fecha_recoleccion, monto 
      FROM paqueteria 
      WHERE DATE(fecha_recoleccion) = ?
      AND usuario_id = ?`, 
       [fecha, usuarioIdFiltro]);


  return {baños: ventasBaños, estacionamiento: ventasEstacionamiento, tienda: ventasTienda, paqueteria: ventasPaqueteria};
}

// ========== FUNCIONES DE USUARIOS Y AUTENTICACIÓN ==========

export interface Usuario {
  id: number;
  usuario: string;
  nombre_completo: string;
  email?: string;
  rol: 'admin' | 'empleado';
  activo: boolean;
  fecha_creacion: string;
  ultimo_acceso?: string;
  intentos_fallidos: number;
  bloqueado_hasta?: string;
}

// Autenticar usuario
export async function autenticarUsuario(usuario: string, password: string): Promise<Usuario | null> {
  const db = await getDb();
  
  // Verificar si el usuario existe y está activo
  const usuarios = await db.select<{
    id: number;
    usuario: string;
    password: string;
    nombre_completo: string;
    email: string | null;
    rol: string;
    activo: number;
    fecha_creacion: string;
    ultimo_acceso: string | null;
    intentos_fallidos: number;
    bloqueado_hasta: string | null;
  }[]>(`
    SELECT * FROM usuarios 
    WHERE usuario = ? AND activo = 1
  `, [usuario]);

  if (usuarios.length === 0) {
    return null;
  }

  const usuarioData = usuarios[0];

  // Verificar si está bloqueado
  if (usuarioData.bloqueado_hasta) {
    const ahora = new Date();
    const bloqueadoHasta = new Date(usuarioData.bloqueado_hasta);
    
    if (ahora < bloqueadoHasta) {
      throw new Error(`Usuario bloqueado hasta ${bloqueadoHasta.toLocaleString()}`);
    } else {
      // Desbloquear usuario si ya pasó el tiempo
      await db.execute(`
        UPDATE usuarios 
        SET bloqueado_hasta = NULL, intentos_fallidos = 0 
        WHERE id = ?
      `, [usuarioData.id]);
    }
  }

  // Verificar contraseña (en producción usar bcrypt)
  if (usuarioData.password !== password) {
    // Incrementar intentos fallidos
    const nuevosIntentos = usuarioData.intentos_fallidos + 1;
    let bloqueadoHasta = null;

    // Bloquear después de 5 intentos fallidos por 30 minutos
    if (nuevosIntentos >= 5) {
      const ahora = new Date();
      ahora.setMinutes(ahora.getMinutes() + 30);
      bloqueadoHasta = ahora.toISOString();
    }

    await db.execute(`
      UPDATE usuarios 
      SET intentos_fallidos = ?, bloqueado_hasta = ? 
      WHERE id = ?
    `, [nuevosIntentos, bloqueadoHasta, usuarioData.id]);

    if (bloqueadoHasta) {
      throw new Error('Usuario bloqueado por demasiados intentos fallidos');
    }

    return null;
  }

  // Login exitoso - actualizar último acceso y resetear intentos
  const ahora = new Date().toISOString();
  await db.execute(`
    UPDATE usuarios 
    SET ultimo_acceso = ?, intentos_fallidos = 0, bloqueado_hasta = NULL 
    WHERE id = ?
  `, [ahora, usuarioData.id]);

  return {
    id: usuarioData.id,
    usuario: usuarioData.usuario,
    nombre_completo: usuarioData.nombre_completo,
    email: usuarioData.email || undefined,
    rol: usuarioData.rol as 'admin' | 'empleado',
    activo: usuarioData.activo === 1,
    fecha_creacion: usuarioData.fecha_creacion,
    ultimo_acceso: ahora,
    intentos_fallidos: 0,
    bloqueado_hasta: undefined
  };
}

// Crear nuevo usuario
export async function crearUsuario(
  usuario: string,
  password: string,
  nombre_completo: string,
  email?: string,
  rol: 'admin' | 'empleado' = 'empleado'
): Promise<number> {
  const db = await getDb();
  
  // Verificar que el usuario no exista
  const existeUsuario = await db.select<{ count: number }[]>(`
    SELECT COUNT(*) as count FROM usuarios WHERE usuario = ?
  `, [usuario]);

  if (existeUsuario[0].count > 0) {
    throw new Error('El usuario ya existe');
  }

  const fechaCreacion = new Date().toISOString();
  const result = await db.execute(`
    INSERT INTO usuarios (usuario, password, nombre_completo, email, rol, fecha_creacion)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [usuario, password, nombre_completo, email, rol, fechaCreacion]);

  return result.lastInsertId as number;
}

// Obtener todos los usuarios
export async function obtenerUsuarios(): Promise<Usuario[]> {
  const db = await getDb();
  const usuarios = await db.select<{
    id: number;
    usuario: string;
    nombre_completo: string;
    email: string | null;
    rol: string;
    activo: number;
    fecha_creacion: string;
    ultimo_acceso: string | null;
    intentos_fallidos: number;
    bloqueado_hasta: string | null;
  }[]>(`
    SELECT id, usuario, nombre_completo, email, rol, activo, 
           fecha_creacion, ultimo_acceso, intentos_fallidos, bloqueado_hasta
    FROM usuarios
    ORDER BY fecha_creacion DESC
  `);

  return usuarios.map(u => ({
    id: u.id,
    usuario: u.usuario,
    nombre_completo: u.nombre_completo,
    email: u.email || undefined,
    rol: u.rol as 'admin' | 'empleado',
    activo: u.activo === 1,
    fecha_creacion: u.fecha_creacion,
    ultimo_acceso: u.ultimo_acceso || undefined,
    intentos_fallidos: u.intentos_fallidos,
    bloqueado_hasta: u.bloqueado_hasta || undefined
  }));
}

// Cambiar contraseña
export async function cambiarPassword(usuarioId: number, passwordAnterior: string, passwordNuevo: string): Promise<boolean> {
  const db = await getDb();
  
  const usuarios = await db.select<{ password: string }[]>(`
    SELECT password FROM usuarios WHERE id = ?
  `, [usuarioId]);

  if (usuarios.length === 0 || usuarios[0].password !== passwordAnterior) {
    return false;
  }

  await db.execute(`
    UPDATE usuarios SET password = ? WHERE id = ?
  `, [passwordNuevo, usuarioId]);

  return true;
}

// Activar/desactivar usuario
export async function cambiarEstadoUsuario(usuarioId: number, activo: boolean): Promise<void> {
  const db = await getDb();
  await db.execute(`
    UPDATE usuarios SET activo = ? WHERE id = ?
  `, [activo ? 1 : 0, usuarioId]);
}

// Desbloquear usuario manualmente
export async function desbloquearUsuario(usuarioId: number): Promise<void> {
  const db = await getDb();
  await db.execute(`
    UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?
  `, [usuarioId]);
}

// ========== FUNCIONES DE REPORTES POR USUARIO ==========

// Obtener ventas por usuario y fecha
export async function obtenerVentasPorUsuario(usuarioId?: number, fecha?: string) {
  const db = await getDb();
  let query = `
    SELECT 
      v.id,
      vt.fecha,
      v.producto,
      v.cantidad,
      v.precio_unitario,
      v.total,
      v.usuario_id,
      v.usuario_nombre
    FROM ventas v
    JOIN ventas_totales vt ON v.venta_id = vt.id
    WHERE 1=1
  `;
  
  const params: any[] = [];
  
  if (usuarioId) {
    query += ` AND v.usuario_id = ?`;
    params.push(usuarioId);
  }
  
  if (fecha) {
    query += ` AND vt.fecha = ?`;
    params.push(fecha);
  }
  
  query += ` ORDER BY vt.fecha DESC, v.id DESC`;
  
  const ventas = await db.select<{
    id: number;
    fecha: string;
    producto: string;
    cantidad: number;
    precio_unitario: number;
    total: number;
    usuario_id: number;
    usuario_nombre: string;
  }[]>(query, params);
  
  return ventas;
}

// Obtener resumen de ventas por usuario
export async function obtenerResumenVentasPorUsuario(usuarioId?: number, fechaInicio?: string, fechaFin?: string) {
  const db = await getDb();
  let query = `
    SELECT 
      usuario_id,
      usuario_nombre,
      COUNT(DISTINCT venta_id) as total_transacciones,
      SUM(total) as total_ventas,
      MIN(fecha) as primera_venta,
      MAX(fecha) as ultima_venta
    FROM ventas v
    JOIN ventas_totales vt ON v.venta_id = vt.id
    WHERE 1=1
  `;
  
  const params: any[] = [];
  
  if (usuarioId) {
    query += ` AND v.usuario_id = ?`;
    params.push(usuarioId);
  }
  
  if (fechaInicio) {
    query += ` AND vt.fecha >= ?`;
    params.push(fechaInicio);
  }
  
  if (fechaFin) {
    query += ` AND vt.fecha <= ?`;
    params.push(fechaFin);
  }
  
  query += ` GROUP BY usuario_id, usuario_nombre ORDER BY total_ventas DESC`;
  
  const resumen = await db.select<{
    usuario_id: number;
    usuario_nombre: string;
    total_transacciones: number;
    total_ventas: number;
    primera_venta: string;
    ultima_venta: string;
  }[]>(query, params);
  
  return resumen;
}

// Obtener todas las operaciones de un usuario por fecha
export async function obtenerOperacionesPorUsuario(usuarioId: number, fecha: string) {
  const db = await getDb();
  
  // Ventas
  const ventas = await db.select<{
    id: number;
    fecha: string;
    producto: string;
    cantidad: number;
    total: number;
    tipo: string;
  }[]>(`
    SELECT 
      v.id,
      vt.fecha,
      v.producto,
      v.cantidad,
      v.total,
      'Venta' as tipo
    FROM ventas v
    JOIN ventas_totales vt ON v.venta_id = vt.id
    WHERE v.usuario_id = ? AND vt.fecha = ?
  `, [usuarioId, fecha]);
  
  // Tickets de estacionamiento
  const tickets = await db.select<{
    id: number;
    fecha: string;
    placas: string;
    total: number | null;
    tipo: string;
  }[]>(`
    SELECT 
      id,
      DATE(fecha_entrada) as fecha,
      placas,
      total,
      'Estacionamiento' as tipo
    FROM tickets
    WHERE usuario_id = ? AND DATE(fecha_entrada) = ?
  `, [usuarioId, fecha]);
  
  // Baños
  const baños = await db.select<{
    id: number;
    fecha: string;
    monto: number;
    tipo: string;
  }[]>(`
    SELECT 
      id,
      DATE(fecha_hora) as fecha,
      monto,
      'Baño' as tipo
    FROM baños
    WHERE usuario_id = ? AND DATE(fecha_hora) = ?
  `, [usuarioId, fecha]);
  
  // Paquetería
  const paqueteria = await db.select<{
    id: number;
    fecha: string;
    monto: number | null;
    tipo: string;
  }[]>(`
    SELECT 
      id,
      DATE(fecha_recoleccion) as fecha,
      monto,
      'Paquetería' as tipo
    FROM paqueteria
    WHERE usuario_id = ? AND DATE(fecha_recoleccion) = ?
  `, [usuarioId, fecha]);
  
  return {
    ventas,
    tickets,
    baños,
    paqueteria
  };
}

// Obtener estadísticas generales por usuario
export async function obtenerEstadisticasUsuario(usuarioId: number, fechaInicio?: string, fechaFin?: string) {
  const db = await getDb();
  
  let whereClause = `WHERE usuario_id = ?`;
  const params: any[] = [usuarioId];
  
  if (fechaInicio && fechaFin) {
    whereClause += ` AND DATE(fecha) >= ? AND DATE(fecha) <= ?`;
    params.push(fechaInicio, fechaFin);
  }
  
  // Estadísticas de ventas
  const ventasStats = await db.select<{
    total_ventas: number | null;
    cantidad_transacciones: number | null;
  }[]>(`
    SELECT 
      SUM(v.total) as total_ventas,
      COUNT(DISTINCT v.venta_id) as cantidad_transacciones
    FROM ventas v
    JOIN ventas_totales vt ON v.venta_id = vt.id
    ${whereClause.replace('fecha', 'vt.fecha')}
  `, params);
  
  // Estadísticas de estacionamiento
  const estacionamientoStats = await db.select<{
    total_tickets: number | null;
    total_ingresos: number | null;
  }[]>(`
    SELECT 
      COUNT(*) as total_tickets,
      SUM(total) as total_ingresos
    FROM tickets
    ${whereClause.replace('fecha', 'fecha_entrada')}
  `, params);
  
  // Estadísticas de baños
  const bañosStats = await db.select<{
    total_usos: number | null;
    total_ingresos: number | null;
  }[]>(`
    SELECT 
      COUNT(*) as total_usos,
      SUM(monto) as total_ingresos
    FROM baños
    ${whereClause.replace('fecha', 'fecha_hora')}
  `, params);
  
  // Estadísticas de paquetería
  const paqueteriaStats = await db.select<{
    total_paquetes: number | null;
    total_ingresos: number | null;
  }[]>(`
    SELECT 
      COUNT(*) as total_paquetes,
      SUM(monto) as total_ingresos
    FROM paqueteria
    ${whereClause.replace('fecha', 'fecha_recoleccion')}
  `, params);
  
  return {
    ventas: {
      total: ventasStats[0]?.total_ventas || 0,
      transacciones: ventasStats[0]?.cantidad_transacciones || 0
    },
    estacionamiento: {
      tickets: estacionamientoStats[0]?.total_tickets || 0,
      ingresos: estacionamientoStats[0]?.total_ingresos || 0
    },
    baños: {
      usos: bañosStats[0]?.total_usos || 0,
      ingresos: bañosStats[0]?.total_ingresos || 0
    },
    paqueteria: {
      paquetes: paqueteriaStats[0]?.total_paquetes || 0,
      ingresos: paqueteriaStats[0]?.total_ingresos || 0
    },
    total_ingresos: 
      (ventasStats[0]?.total_ventas || 0) +
      (estacionamientoStats[0]?.total_ingresos || 0) +
      (bañosStats[0]?.total_ingresos || 0) +
      (paqueteriaStats[0]?.total_ingresos || 0)
  };
}