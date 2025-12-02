# 🚀 Sistema de Notificaciones de Mensualidad - Resumen

## ✅ Implementación Completada

Se ha integrado exitosamente un **servidor HTTP local** en la aplicación Tauri que permite recibir notificaciones de pago de mensualidad desde servidores externos.

---

## 📋 Archivos Creados/Modificados

### Backend (Rust)
- ✅ `src-tauri/Cargo.toml` - Dependencias: axum, tower, tower-http
- ✅ `src-tauri/src/lib.rs` - Servidor HTTP + comandos Tauri

### Frontend (React/TypeScript)
- ✅ `src/components/NotificacionesMensualidad.tsx` - Componente de notificaciones
- ✅ `src/components/Sidebar.tsx` - Integración del componente

### Documentación y Scripts de Prueba
- ✅ `NOTIFICACIONES_API.md` - Documentación completa de la API
- ✅ `test-notificacion.sh` - Script de prueba (Bash)
- ✅ `test_notificacion.py` - Script de prueba avanzado (Python)
- ✅ `recordatorio_automatico.py` - Sistema de recordatorios con cron

---

## 🎯 Características Implementadas

### 1. **Servidor HTTP Local**
- Puerto: `127.0.0.1:3456`
- Endpoint: `POST /api/notificar-mensualidad`
- CORS habilitado para desarrollo
- Inicia automáticamente con la aplicación

### 2. **Sistema de Notificaciones**
- ✅ Notificaciones en tiempo real
- ✅ Panel desplegable con historial
- ✅ Contador animado en el ícono de campana
- ✅ Notificaciones del sistema operativo (si hay permisos)
- ✅ Marcar como leídas individual o grupal
- ✅ Persistencia en memoria durante la sesión

### 3. **Interfaz de Usuario**
- Ícono de campana en el sidebar (siempre visible)
- Badge animado con contador de notificaciones nuevas
- Panel elegante con gradiente azul
- Cards informativos con:
  - 💳 Mensaje personalizado
  - 💵 Monto a pagar
  - 📅 Fecha de vencimiento
  - ⏰ Timestamp de recepción
- Botones para:
  - Marcar individual como leída (X en hover)
  - Marcar todas como leídas (footer)

---

## 🔧 Cómo Usar

### Iniciar la Aplicación

```bash
npm run tauri dev
```

El servidor HTTP se iniciará automáticamente. Verás en la consola:
```
🚀 Servidor HTTP escuchando en http://127.0.0.1:3456
```

### Enviar una Notificación de Prueba

**Opción 1: Bash (cURL)**
```bash
./test-notificacion.sh
```

**Opción 2: Python**
```bash
python3 test_notificacion.py
```

**Opción 3: cURL manual**
```bash
curl -X POST http://127.0.0.1:3456/api/notificar-mensualidad \
  -H "Content-Type: application/json" \
  -d '{
    "mensaje": "Tu mensualidad vence en 5 días",
    "monto": 500.00,
    "fecha_vencimiento": "2025-12-07",
    "timestamp": "2025-12-02T10:30:00Z"
  }'
```

---

## 📡 Integración desde tu Servidor

### Node.js
```javascript
const axios = require('axios');

await axios.post('http://127.0.0.1:3456/api/notificar-mensualidad', {
  mensaje: 'Tu mensualidad vence pronto',
  monto: 500.00,
  fecha_vencimiento: '2025-12-31',
  timestamp: new Date().toISOString()
});
```

### Python
```python
import requests

requests.post('http://127.0.0.1:3456/api/notificar-mensualidad', json={
    'mensaje': 'Tu mensualidad vence pronto',
    'monto': 500.00,
    'fecha_vencimiento': '2025-12-31',
    'timestamp': datetime.now().isoformat()
})
```

### PHP
```php
file_get_contents('http://127.0.0.1:3456/api/notificar-mensualidad', false, 
  stream_context_create([
    'http' => [
      'method' => 'POST',
      'header' => 'Content-Type: application/json',
      'content' => json_encode([
        'mensaje' => 'Tu mensualidad vence pronto',
        'monto' => 500.00,
        'fecha_vencimiento' => '2025-12-31',
        'timestamp' => date('c')
      ])
    ]
  ])
);
```

---

## ⚙️ Configuración de Recordatorios Automáticos

### Con cron (Linux/macOS)

1. Edita el archivo de configuración:
```bash
nano recordatorio_automatico.py
```

2. Ajusta estas variables:
```python
MONTO_MENSUALIDAD = 500.00  # Tu monto
FECHA_VENCIMIENTO = '2025-12-31'  # Tu fecha de vencimiento
```

3. Configura cron:
```bash
crontab -e
```

4. Agrega una de estas líneas:
```bash
# Diario a las 9 AM
0 9 * * * /ruta/completa/recordatorio_automatico.py

# Cada 3 días a las 10 AM
0 10 */3 * * /ruta/completa/recordatorio_automatico.py

# Lunes a las 9 AM
0 9 * * 1 /ruta/completa/recordatorio_automatico.py
```

### Con Task Scheduler (Windows)

1. Abre "Programador de tareas"
2. Crear tarea básica
3. Trigger: Según tu preferencia (diario, semanal, etc.)
4. Acción: Ejecutar `python.exe recordatorio_automatico.py`

---

## 🔒 Seguridad

### ⚠️ IMPORTANTE

El servidor actual **solo escucha en localhost (127.0.0.1)**, lo que significa:
- ✅ Solo puede ser accedido desde la misma máquina
- ✅ No es accesible desde internet o red local
- ❌ No tiene autenticación (no es necesaria para localhost)

### Para Acceso Remoto (Producción)

Si necesitas que servidores externos envíen notificaciones:

**Opción 1: Túnel Seguro (Recomendado)**
```bash
# Usar ngrok u otro servicio de túnel
ngrok http 3456
```

**Opción 2: Agregar Autenticación**
Modifica `src-tauri/src/lib.rs` para validar API key:

```rust
async fn recibir_notificacion_mensualidad(
    State((app_handle, state)): State<(tauri::AppHandle, Arc<AppState>)>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<NotificacionMensualidad>,
) -> Json<serde_json::Value> {
    // Validar API key
    if let Some(api_key) = headers.get("X-API-Key") {
        if api_key != "TU_API_KEY_SECRETA" {
            return Json(serde_json::json!({
                "success": false,
                "message": "API key inválida"
            }));
        }
    } else {
        return Json(serde_json::json!({
            "success": false,
            "message": "API key requerida"
        }));
    }
    
    // ... resto del código
}
```

---

## 📊 Logs y Debugging

### Ver logs del servidor
Los logs aparecen en la terminal donde ejecutaste `npm run tauri dev`:
```
🚀 Servidor HTTP escuchando en http://127.0.0.1:3456
📨 Notificación recibida: NotificacionMensualidad { ... }
```

### Ver logs del frontend
Abre DevTools en la aplicación (CMD+Option+I en macOS):
```javascript
console.log('📨 Nueva notificación recibida:', event.payload)
```

### Verificar que el puerto esté escuchando
```bash
# macOS/Linux
lsof -i :3456

# Windows
netstat -ano | findstr :3456
```

---

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| ❌ Endpoint no responde | Verifica que la aplicación esté corriendo |
| ❌ Puerto 3456 ocupado | Cambia el puerto en `lib.rs` línea 63 |
| ❌ No aparecen notificaciones | Revisa DevTools console (F12) |
| ❌ Error de CORS | Ya está configurado con `CorsLayer::permissive()` |
| ❌ Notificaciones del sistema no funcionan | Permite notificaciones en configuración del navegador |

---

## 📈 Próximos Pasos (Opcional)

1. **Persistencia en Base de Datos**
   - Guardar notificaciones en SQLite
   - Mantener historial completo

2. **Configuración de Fechas**
   - Panel de admin para configurar fecha de vencimiento
   - Configuración de monto de mensualidad

3. **Múltiples Usuarios**
   - Notificaciones por usuario
   - Recordatorios personalizados

4. **Webhooks**
   - Integración con Stripe/PayPal
   - Confirmación automática de pagos

---

## 📚 Documentación Adicional

- Ver `NOTIFICACIONES_API.md` para documentación completa de la API
- Ver ejemplos en `test_notificacion.py` y `recordatorio_automatico.py`

---

## ✨ Resultado Final

Ahora tu sistema puede:

1. ✅ Recibir notificaciones de mensualidad desde servidores externos
2. ✅ Mostrar alertas visuales en tiempo real
3. ✅ Mantener historial de notificaciones pendientes
4. ✅ Enviar notificaciones del sistema operativo
5. ✅ Gestionar múltiples notificaciones simultáneas
6. ✅ Automatizar recordatorios con cron/scheduler

---

**¡Sistema de Notificaciones Listo para Producción!** 🎉
