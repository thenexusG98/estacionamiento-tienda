# 📡 Sistema de Notificaciones de Mensualidad

## 🎯 Descripción

Este sistema permite que tu servidor externo envíe notificaciones de pago de mensualidad a la aplicación de escritorio. Las notificaciones aparecen en tiempo real con un icono de campana en el sidebar.

---

## 🚀 Configuración

### 1. Puerto del Servidor Local

La aplicación escucha en: **`http://127.0.0.1:3456`**

Este servidor HTTP local se inicia automáticamente cuando se ejecuta la aplicación Tauri.

---

## 📨 Cómo Enviar Notificaciones

### Endpoint

```
POST http://127.0.0.1:3456/api/notificar-mensualidad
```

### Headers Requeridos

```
Content-Type: application/json
```

### Body (JSON)

```json
{
  "mensaje": "Tu mensualidad del sistema vence pronto. Por favor realiza el pago.",
  "monto": 500.00,
  "fecha_vencimiento": "2025-12-31",
  "timestamp": "2025-12-02T10:30:00Z"
}
```

### Campos

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `mensaje` | string | Mensaje descriptivo de la notificación | "Tu mensualidad vence en 3 días" |
| `monto` | number | Cantidad a pagar | 500.00 |
| `fecha_vencimiento` | string | Fecha de vencimiento en formato ISO | "2025-12-31" |
| `timestamp` | string | Fecha y hora de la notificación en formato ISO | "2025-12-02T10:30:00Z" |

---

## 💻 Ejemplos de Uso

### 📘 JavaScript/Node.js

```javascript
const axios = require('axios');

async function enviarNotificacionMensualidad() {
  try {
    const response = await axios.post('http://127.0.0.1:3456/api/notificar-mensualidad', {
      mensaje: 'Tu mensualidad del sistema vence en 5 días. Por favor realiza el pago.',
      monto: 500.00,
      fecha_vencimiento: '2025-12-07',
      timestamp: new Date().toISOString()
    });

    console.log('✅ Notificación enviada:', response.data);
  } catch (error) {
    console.error('❌ Error al enviar notificación:', error.message);
  }
}

enviarNotificacionMensualidad();
```

### 🐍 Python

```python
import requests
from datetime import datetime

def enviar_notificacion_mensualidad():
    url = 'http://127.0.0.1:3456/api/notificar-mensualidad'
    
    payload = {
        'mensaje': 'Tu mensualidad del sistema vence en 5 días. Por favor realiza el pago.',
        'monto': 500.00,
        'fecha_vencimiento': '2025-12-07',
        'timestamp': datetime.now().isoformat()
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        print('✅ Notificación enviada:', response.json())
    except requests.exceptions.RequestException as e:
        print(f'❌ Error al enviar notificación: {e}')

enviar_notificacion_mensualidad()
```

### 🌐 PHP

```php
<?php
$url = 'http://127.0.0.1:3456/api/notificar-mensualidad';

$data = [
    'mensaje' => 'Tu mensualidad del sistema vence en 5 días. Por favor realiza el pago.',
    'monto' => 500.00,
    'fecha_vencimiento' => '2025-12-07',
    'timestamp' => date('c')
];

$options = [
    'http' => [
        'header'  => "Content-Type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data)
    ]
];

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);

if ($result === FALSE) {
    echo "❌ Error al enviar notificación\n";
} else {
    echo "✅ Notificación enviada: $result\n";
}
?>
```

### 📋 cURL

```bash
curl -X POST http://127.0.0.1:3456/api/notificar-mensualidad \
  -H "Content-Type: application/json" \
  -d '{
    "mensaje": "Tu mensualidad del sistema vence en 5 días. Por favor realiza el pago.",
    "monto": 500.00,
    "fecha_vencimiento": "2025-12-07",
    "timestamp": "2025-12-02T10:30:00Z"
  }'
```

---

## 📊 Respuesta del Servidor

### Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "message": "Notificación recibida correctamente"
}
```

### Respuesta de Error (500)

```json
{
  "success": false,
  "message": "Error al procesar la notificación"
}
```

---

## 🔔 Comportamiento de las Notificaciones

1. **Notificación Visual**: Aparece un ícono de campana con un contador en el sidebar
2. **Notificación del Sistema**: Si el usuario tiene permisos, se muestra una notificación nativa
3. **Panel Desplegable**: Al hacer clic en la campana, se abre un panel con todas las notificaciones
4. **Persistencia**: Las notificaciones se mantienen hasta que el usuario las marque como leídas
5. **Animación**: El contador tiene una animación de pulso para llamar la atención

---

## 🛡️ Consideraciones de Seguridad

### ⚠️ Importante

- El servidor **solo escucha en localhost (127.0.0.1)**, por lo que solo puede ser accedido desde la misma máquina
- Si necesitas enviar notificaciones desde un servidor remoto, deberás:
  1. Usar un servicio intermediario (webhook)
  2. Implementar autenticación (API key, JWT, etc.)
  3. Configurar HTTPS si expones el puerto

### 🔐 Para Producción

Si quieres exponer este endpoint de forma segura:

1. **Agregar autenticación**:
```rust
// En lib.rs, modificar el handler
async fn recibir_notificacion_mensualidad(
    State((app_handle, state)): State<(tauri::AppHandle, Arc<AppState>)>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<NotificacionMensualidad>,
) -> Json<serde_json::Value> {
    // Verificar API key
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

2. **Usar HTTPS** con certificados SSL
3. **Limitar rate limiting** para prevenir spam

---

## 🧪 Pruebas

### Test Rápido

Puedes probar el endpoint con este comando cURL:

```bash
# Asegúrate de que la aplicación esté corriendo
curl -X POST http://127.0.0.1:3456/api/notificar-mensualidad \
  -H "Content-Type: application/json" \
  -d '{
    "mensaje": "Prueba de notificación",
    "monto": 100.00,
    "fecha_vencimiento": "2025-12-31",
    "timestamp": "2025-12-02T10:00:00Z"
  }'
```

Deberías ver:
1. En la terminal del servidor: `📨 Notificación recibida: ...`
2. En la aplicación: Aparece el contador en la campana
3. Respuesta JSON: `{"success":true,"message":"Notificación recibida correctamente"}`

---

## 🐛 Troubleshooting

### El endpoint no responde

1. Verifica que la aplicación esté corriendo
2. Revisa la consola para ver si hay errores
3. Verifica que el puerto 3456 esté disponible:
   ```bash
   lsof -i :3456  # macOS/Linux
   netstat -ano | findstr :3456  # Windows
   ```

### Las notificaciones no aparecen

1. Verifica la consola del navegador (F12)
2. Asegúrate de que el JSON sea válido
3. Revisa que todos los campos requeridos estén presentes

### El servidor usa otro puerto

Si necesitas cambiar el puerto, modifica en `src-tauri/src/lib.rs`:

```rust
let listener = tokio::net::TcpListener::bind("127.0.0.1:TU_PUERTO")
    .await
    .expect("No se pudo iniciar el servidor");
```

---

## 📝 Notas Adicionales

- Las notificaciones se almacenan en memoria, se pierden al cerrar la aplicación
- Si necesitas persistencia, puedes guardarlas en SQLite
- El sistema soporta múltiples notificaciones simultáneas
- Las notificaciones se ordenan por fecha de recepción (más recientes primero)

---

## 📞 Soporte

Si tienes problemas o preguntas, revisa:
1. Los logs de la consola de la aplicación
2. Los logs del servidor Rust
3. La respuesta HTTP del endpoint

---

## 🎉 Ejemplo Completo de Integración

### Servidor Node.js con Recordatorios Automáticos

```javascript
const cron = require('node-cron');
const axios = require('axios');

// Ejecutar cada día a las 9 AM
cron.schedule('0 9 * * *', async () => {
  const fechaVencimiento = new Date();
  fechaVencimiento.setDate(fechaVencimiento.getDate() + 5); // 5 días
  
  try {
    await axios.post('http://127.0.0.1:3456/api/notificar-mensualidad', {
      mensaje: 'Recordatorio: Tu mensualidad vence en 5 días.',
      monto: 500.00,
      fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Recordatorio enviado');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
});
```

---

**¡Listo!** 🚀 Ya puedes enviar notificaciones de mensualidad desde tu servidor.
