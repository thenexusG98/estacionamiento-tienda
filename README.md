# Estacionamiento Tienda

Este proyecto es una aplicación desarrollada con **Tauri**, **React**, y **TypeScript** utilizando **Vite** como herramienta de construcción. La aplicación está diseñada para gestionar un sistema de estacionamiento y tienda, proporcionando funcionalidades como el manejo de inventarios, ventas, reportes, y más.

## Estructura del Proyecto

El proyecto está organizado de la siguiente manera:

### Carpeta `src`

- **`App.tsx`**: Punto de entrada principal de la aplicación React. Maneja la navegación entre las diferentes secciones de la aplicación.
- **`components/`**: Contiene los componentes principales de la interfaz de usuario:
  - **`Dashboard.tsx`**: Muestra un resumen de las ventas, productos más vendidos, y accesos rápidos a otras secciones.
  - **`Sidebar.tsx`**: Barra lateral para la navegación entre las secciones.
  - **`Ventas.tsx`**: Gestión de ventas.
  - **`Inventario.tsx`**: Gestión del inventario de productos.
  - **`Productos.tsx`**: Registro de nuevos productos.
  - **`Reportes.tsx`**: Visualización de reportes diarios.
  - **`VentasRegistradas.tsx`**: Historial de ventas registradas.
- **`lib/`**: Contiene funciones auxiliares para interactuar con la base de datos:
  - **`db.ts`**: Funciones para obtener datos como resumen del día, productos más vendidos, y más.

### Carpeta `src-tauri`

- **`main.rs`**: Archivo principal de la aplicación Tauri en Rust.
- **`tauri.conf.json`**: Configuración de Tauri.
- **`icons/`**: Iconos utilizados en la aplicación.

## Funcionalidades Principales

1. **Dashboard**:
   - Resumen de ventas del día.
   - Productos más vendidos.
   - Accesos rápidos a otras secciones.

2. **Gestión de Ventas**:
   - Registro de nuevas ventas.
   - Visualización del historial de ventas.

3. **Gestión de Inventario**:
   - Visualización y actualización del inventario de productos.

4. **Registro de Productos**:
   - Agregar nuevos productos al sistema.

5. **Reportes**:
   - Generación y visualización de reportes diarios.

## Requisitos Previos

- **Node.js**: Para ejecutar el entorno de desarrollo de React.
- **Rust**: Para compilar y ejecutar la aplicación Tauri.
- **Vite**: Herramienta de construcción para el proyecto.

## Instalación y Ejecución

1. Clona este repositorio:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   ```

2. Instala las dependencias de Node.js:
   ```bash
   npm install
   ```

3. Ejecuta la aplicación en modo desarrollo:
   ```bash
   npm run tauri dev
   ```

4. Para construir la aplicación para producción:
   ```bash
   npm run tauri build
   ```

## Contribuciones

Si deseas contribuir a este proyecto, por favor abre un issue o envía un pull request con tus cambios.

## Licencia

Este proyecto está bajo la licencia MIT.
