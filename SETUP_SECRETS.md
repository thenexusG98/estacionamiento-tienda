# 🔐 Configuración de Secrets en GitHub

## Claves generadas exitosamente ✅

Las claves de firma para actualizaciones automáticas han sido generadas y guardadas en:
- **Clave privada:** `~/.tauri/estacionamiento-tienda.key`
- **Clave pública:** `~/.tauri/estacionamiento-tienda.key.pub`

## 📋 Pasos para agregar los secrets en GitHub:

### 1. Ve a la configuración de secrets de tu repositorio:
```
https://github.com/thenexusG98/estacionamiento-tienda/settings/secrets/actions
```

### 2. Haz clic en "New repository secret"

### 3. Agrega el primer secret:

**Name:** `TAURI_SIGNING_PRIVATE_KEY`

**Value:** (Copia el contenido completo de la clave privada)
```
dW50cnVzdGVkIGNvbW1lbnQ6IHJzaWduIGVuY3J5cHRlZCBzZWNyZXQga2V5ClJXUlRZMEl5MzgwZnlKckYyaExEcWRRODVJMU1NVzJ1OHpZR24yM2EwekQyQ2lJMmZCb0FBQkFBQUFBQUFBQUFBQUlBQUFBQUNWa0VnM1VGbjZ2aE0xOUlpTVp6QWc3dG9vQmRicGdCVy9Hd25VTEFSZzA4M0d1TDNnN0pxQ245MGFuT2xOMkZRd3lZdkRMT0NOTmp0SnBTMThNaDZDcVFLdC9OS250Q2wzVi9DQ1lqcTBwM0YrWVloelF0WjRxSEVhcDNkbVR0T2pPUXl1Ym9rZmc9Cg==
```

### 4. Agrega el segundo secret:

**Name:** `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

**Value:** (La contraseña que ingresaste al generar las claves)

---

## ✅ Verificación

Una vez agregados los secrets:

1. Haz commit y push de los cambios en `tauri.conf.json` y `.github/workflows/main.yml`
2. El workflow de GitHub Actions se ejecutará automáticamente
3. Generará releases firmados con actualizaciones automáticas habilitadas

## ⚠️ IMPORTANTE

- **NUNCA** compartas la clave privada ni la contraseña
- **GUARDA** una copia de respaldo de `~/.tauri/estacionamiento-tienda.key` en un lugar seguro
- Si pierdes la clave o contraseña, tendrás que generar nuevas claves y los usuarios no podrán actualizar automáticamente

## 🔄 Clave pública actualizada

La clave pública ya ha sido actualizada en `src-tauri/tauri.conf.json`:
```
dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDdBNEFDRTkxQUVERTVGMzUKUldRMVg5NnVrYzVLZXJibGIrRWJ5VThncUhVR3ZuNHQ4T1RvZ3d0ZnV6RjMvUFYzbGxEYkF3TjEK
```
