# 🔄 Sistema de Sincronización Automática de Versiones

## 📋 Resumen

Este sistema sincroniza automáticamente la versión de la aplicación en todos los archivos necesarios cuando se crea un nuevo tag en GitHub.

## 🎯 Archivos que se Actualizan Automáticamente

Cuando se hace push a `main`, el workflow de GitHub Actions:

1. **Calcula la nueva versión** (incrementa el patch automáticamente)
2. **Actualiza `package.json`** con la nueva versión
3. **Ejecuta `sync-version.js`** que actualiza:
   - `src-tauri/tauri.conf.json`
   - `src-tauri/Cargo.toml`
4. **Hace commit** de todos los cambios
5. **Crea el tag** (ejemplo: v0.1.23)
6. **Compila la aplicación** con la nueva versión
7. **Crea el release** en GitHub

## 🖥️ Dónde se Muestra la Versión

La versión se muestra automáticamente en:

### 1. **Pantalla de Login**
- Footer: "Sistema de Gestión de Tienda v0.1.23"
- Se actualiza automáticamente desde `package.json`

### 2. **Sidebar (Menú lateral)**
- Footer del sidebar: "v0.1.23"
- Se actualiza automáticamente desde `package.json`

### 3. **Archivos de Configuración**
- `package.json` - Versión del proyecto npm
- `src-tauri/tauri.conf.json` - Versión de Tauri
- `src-tauri/Cargo.toml` - Versión del proyecto Rust

## 🔧 Cómo Funciona

### Flujo Automático:

```
1. Developer: git push origin main
   ↓
2. GitHub Actions ejecuta workflow
   ↓
3. Calcula nueva versión (ej: 0.1.22 → 0.1.23)
   ↓
4. Actualiza package.json → 0.1.23
   ↓
5. Ejecuta sync-version.js
   ├─ Actualiza tauri.conf.json → 0.1.23
   └─ Actualiza Cargo.toml → 0.1.23
   ↓
6. Commit: "chore: bump version to 0.1.23 [skip ci]"
   ↓
7. Crea tag: v0.1.23
   ↓
8. Compila app con versión 0.1.23
   ↓
9. Crea release en GitHub con archivos
   ↓
10. Login y Sidebar muestran v0.1.23 automáticamente
```

## 📁 Archivos Importantes

### `scripts/sync-version.js`
Script que lee `package.json` y sincroniza la versión en:
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`

### `src/lib/version.ts`
Exporta la versión desde `package.json` para usar en componentes React:
```typescript
import { APP_VERSION } from '../lib/version';
// APP_VERSION = "0.1.23"
```

### `.github/workflows/main.yml`
Workflow que:
1. Calcula nueva versión
2. Actualiza package.json
3. Ejecuta sync-version.js
4. Hace commit y tag
5. Compila y crea release

## 🎨 Componentes que Usan la Versión

### Login.tsx
```tsx
import { APP_VERSION } from '../lib/version';

// En el footer:
<p className="text-blue-200 text-sm">
  Sistema de Gestión de Tienda v{APP_VERSION}
</p>
```

### Sidebar.tsx
```tsx
import { APP_VERSION } from '../lib/version';

// En el footer:
<div className="mt-3 text-center">
  <p className="text-xs text-blue-300">
    v{APP_VERSION}
  </p>
</div>
```

## 🚀 Uso

### Para Incrementar la Versión:

Simplemente haz push a main:
```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
```

El workflow automáticamente:
- ✅ Incrementará la versión (0.1.22 → 0.1.23)
- ✅ Actualizará todos los archivos
- ✅ Creará el tag v0.1.23
- ✅ Generará el release
- ✅ La app mostrará v0.1.23 en Login y Sidebar

### Para Cambiar Versión Manualmente:

Si necesitas una versión específica (ej: cambiar de 0.1.x a 0.2.0):

1. Edita `package.json`:
```json
{
  "version": "0.2.0"
}
```

2. Ejecuta el script de sincronización:
```bash
node scripts/sync-version.js
```

3. Haz commit:
```bash
git add .
git commit -m "chore: bump version to 0.2.0"
git push origin main
```

## 🔍 Verificar Versión

### En Desarrollo:
```bash
# Ver versión actual
cat package.json | grep version

# Sincronizar manualmente
node scripts/sync-version.js

# Verificar que se aplicó
cat src-tauri/tauri.conf.json | grep version
cat src-tauri/Cargo.toml | grep version
```

### En la App:
- Abre la app
- Login: Mira el footer "Sistema de Gestión de Tienda v0.1.23"
- Sidebar: Mira el footer "v0.1.23"

## ⚙️ Configuración del Workflow

El workflow incrementa automáticamente el **PATCH** (tercer número):
- 0.1.22 → 0.1.23
- 0.1.23 → 0.1.24
- etc.

Si necesitas incrementar MINOR o MAJOR, edita el workflow en:
`.github/workflows/main.yml` línea ~43

## 📝 Notas

- ✅ La versión se sincroniza automáticamente
- ✅ No necesitas editar manualmente 3 archivos
- ✅ El commit de versión tiene `[skip ci]` para evitar loops infinitos
- ✅ La versión se muestra en tiempo real en Login y Sidebar
- ✅ Los releases incluyen la versión correcta en todos los archivos

## 🎯 Beneficios

1. **Consistencia**: Misma versión en todos los archivos
2. **Automatización**: Sin edición manual
3. **Visibilidad**: Usuarios ven la versión actual
4. **Trazabilidad**: Tags y releases correctamente versionados
5. **Simplicidad**: Un solo push actualiza todo
