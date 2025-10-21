# 📊 Sistema de Auditoría de Usuarios

## Descripción General
Se ha implementado un sistema completo de auditoría que registra qué usuario realiza cada operación en el sistema. Esto permite generar reportes específicos por usuario y rastrear todas las actividades.

## 🗄️ Cambios en la Base de Datos

### Tablas Modificadas
Todas las tablas principales ahora incluyen campos de auditoría:

1. **ventas_totales**
   - `usuario_id` - ID del usuario que registró la venta
   - `usuario_nombre` - Nombre del usuario

2. **ventas**
   - `usuario_id` - ID del usuario que registró el detalle
   - `usuario_nombre` - Nombre del usuario

3. **productos**
   - `usuario_id` - ID del usuario que agregó el producto
   - `usuario_nombre` - Nombre del usuario

4. **tickets** (Estacionamiento)
   - `usuario_id` - ID del usuario que registró el ticket
   - `usuario_nombre` - Nombre del usuario

5. **baños**
   - `usuario_id` - ID del usuario que registró el uso
   - `usuario_nombre` - Nombre del usuario

6. **paqueteria**
   - `usuario_id` - ID del usuario que registró la entrega/recolección
   - `usuario_nombre` - Nombre del usuario

## 🔧 Funciones de Gestión de Sesión

### `setUsuarioSesion(usuario)`
Establece el usuario actual en sesión. Se llama automáticamente al hacer login.

```typescript
setUsuarioSesion({
  id: 1,
  usuario: 'admin',
  nombre: 'Administrador'
});
```

### `getUsuarioSesion()`
Obtiene el usuario actualmente en sesión.

```typescript
const usuario = getUsuarioSesion();
// { id: 1, usuario: 'admin', nombre: 'Administrador' }
```

## 📈 Funciones de Reportes por Usuario

### 1. `obtenerVentasPorUsuario(usuarioId?, fecha?)`
Obtiene todas las ventas realizadas por un usuario específico.

**Parámetros:**
- `usuarioId` (opcional) - ID del usuario
- `fecha` (opcional) - Fecha en formato YYYY-MM-DD

**Retorna:** Array de ventas con detalles completos

**Ejemplo:**
```typescript
// Todas las ventas de hoy del usuario actual
const ventas = await obtenerVentasPorUsuario(1, '2025-10-20');

// Todas las ventas de un usuario
const ventas = await obtenerVentasPorUsuario(1);

// Todas las ventas del día (todos los usuarios)
const ventas = await obtenerVentasPorUsuario(undefined, '2025-10-20');
```

### 2. `obtenerResumenVentasPorUsuario(usuarioId?, fechaInicio?, fechaFin?)`
Obtiene un resumen de ventas por usuario con totales y estadísticas.

**Parámetros:**
- `usuarioId` (opcional) - ID del usuario
- `fechaInicio` (opcional) - Fecha inicial
- `fechaFin` (opcional) - Fecha final

**Retorna:**
```typescript
{
  usuario_id: number,
  usuario_nombre: string,
  total_transacciones: number,
  total_ventas: number,
  primera_venta: string,
  ultima_venta: string
}
```

**Ejemplo:**
```typescript
// Resumen de todos los usuarios del mes
const resumen = await obtenerResumenVentasPorUsuario(
  undefined,
  '2025-10-01',
  '2025-10-31'
);
```

### 3. `obtenerOperacionesPorUsuario(usuarioId, fecha)`
Obtiene TODAS las operaciones realizadas por un usuario en una fecha específica.

**Parámetros:**
- `usuarioId` (requerido) - ID del usuario
- `fecha` (requerido) - Fecha en formato YYYY-MM-DD

**Retorna:**
```typescript
{
  ventas: Array,        // Ventas de productos
  tickets: Array,       // Tickets de estacionamiento
  baños: Array,         // Registros de baños
  paqueteria: Array     // Paquetes entregados/recolectados
}
```

**Ejemplo:**
```typescript
const operaciones = await obtenerOperacionesPorUsuario(1, '2025-10-20');
console.log(`Ventas: ${operaciones.ventas.length}`);
console.log(`Tickets: ${operaciones.tickets.length}`);
console.log(`Baños: ${operaciones.baños.length}`);
console.log(`Paquetería: ${operaciones.paqueteria.length}`);
```

### 4. `obtenerEstadisticasUsuario(usuarioId, fechaInicio?, fechaFin?)`
Obtiene estadísticas completas de un usuario con totales por categoría.

**Parámetros:**
- `usuarioId` (requerido) - ID del usuario
- `fechaInicio` (opcional) - Fecha inicial
- `fechaFin` (opcional) - Fecha final

**Retorna:**
```typescript
{
  ventas: {
    total: number,
    transacciones: number
  },
  estacionamiento: {
    tickets: number,
    ingresos: number
  },
  baños: {
    usos: number,
    ingresos: number
  },
  paqueteria: {
    paquetes: number,
    ingresos: number
  },
  total_ingresos: number
}
```

**Ejemplo:**
```typescript
// Estadísticas del usuario del mes actual
const stats = await obtenerEstadisticasUsuario(
  1,
  '2025-10-01',
  '2025-10-31'
);

console.log(`Total de ingresos: $${stats.total_ingresos}`);
console.log(`Ventas: $${stats.ventas.total} (${stats.ventas.transacciones} transacciones)`);
```

## 🔄 Flujo de Trabajo

### Al hacer Login
1. El usuario ingresa sus credenciales
2. Se autentica con la base de datos
3. Se establece automáticamente en sesión con `setUsuarioSesion()`
4. Todas las operaciones posteriores se registran con su información

### Al realizar una Operación
1. Se obtiene el usuario en sesión con `getUsuarioSesion()`
2. Se incluye su ID y nombre en el INSERT/UPDATE
3. Queda registrado en la base de datos

### Al hacer Logout
1. Se limpia la sesión con `setUsuarioSesion(null)`
2. Se elimina la información de localStorage

## 📋 Ejemplo de Uso Completo

```typescript
import { 
  getUsuarioSesion, 
  obtenerEstadisticasUsuario,
  obtenerVentasPorUsuario 
} from './lib/db';

// Obtener usuario actual
const usuario = getUsuarioSesion();

if (usuario) {
  // Ver mis estadísticas de hoy
  const hoy = new Date().toISOString().slice(0, 10);
  const misVentas = await obtenerVentasPorUsuario(usuario.id, hoy);
  
  console.log(`Hoy has realizado ${misVentas.length} ventas`);
  
  // Ver mis estadísticas del mes
  const stats = await obtenerEstadisticasUsuario(
    usuario.id,
    '2025-10-01',
    '2025-10-31'
  );
  
  console.log(`Total del mes: $${stats.total_ingresos}`);
}
```

## 🎯 Casos de Uso

### 1. Reporte de Ventas por Usuario
```typescript
const ventasEmpleado = await obtenerVentasPorUsuario(empleadoId);
```

### 2. Ranking de Empleados
```typescript
const ranking = await obtenerResumenVentasPorUsuario(
  undefined, 
  '2025-10-01', 
  '2025-10-31'
);
// Ordena por total_ventas DESC
```

### 3. Auditoría de Operaciones del Día
```typescript
const operaciones = await obtenerOperacionesPorUsuario(
  usuarioId, 
  '2025-10-20'
);
```

### 4. Dashboard Personal
```typescript
const stats = await obtenerEstadisticasUsuario(usuarioId);
```

## ⚠️ Consideraciones

1. **Seguridad**: Los usuarios solo deberían ver sus propios reportes (excepto administradores)
2. **Performance**: Los reportes con rangos de fechas grandes pueden ser lentos
3. **Integridad**: El sistema registra `null` si no hay usuario en sesión (operaciones antiguas)
4. **Migración**: Los datos existentes tendrán `usuario_id` y `usuario_nombre` como `null`

## 🔒 Roles y Permisos

### Usuario Empleado
- Ver solo sus propios reportes
- Ver solo sus propias operaciones
- No puede ver estadísticas de otros usuarios

### Usuario Administrador
- Ver reportes de todos los usuarios
- Ver estadísticas generales
- Generar reportes comparativos
- Auditar todas las operaciones

## 📊 Próximos Pasos

Para implementar la UI de reportes, considera:

1. Agregar un filtro de usuarios en el componente Reportes
2. Mostrar gráficas por usuario
3. Tabla comparativa de empleados
4. Exportar reportes por usuario a CSV/PDF
5. Dashboard personalizado por usuario
