# Sistema de Notificaciones de Mensualidad

## Estado Actual

El sistema de notificaciones está implementado con dos opciones:

### Opción 1: Servidor Integrado en Rust (EN COMPILACIÓN)

El servidor HTTP está integrado directamente en la aplicación Tauri usando Axum. 
**Estado:** Actualmente en proceso de compilación debido a conflictos de dependencias.

**Ventajas:**
- Todo-en-uno, no requiere procesos adicionales
- Mejor rendimiento
- Integración directa con el sistema de eventos de Tauri

**Limitaciones actuales:**
- Problemas de compatibilidad entre versiones de dependencias
- Tiempo de compilación extenso (~15-20 minutos)
- Requiere resolución de símbolos LLVM

### Opción 2: Servidor Proxy en Python (DISPONIBLE AHORA) ✅

Un servidor HTTP standalone en Python que funciona como proxy.

**Uso:**
```bash
python3 servidor_proxy_notificaciones.py
```

**Características:**
- ✅ Funcional inmediatamente
- ✅ Mismo endpoint: POST http://127.0.0.1:3456/api/notificar-mensualidad
- ✅ Compatible con el mismo formato JSON
- ✅ Guarda notificaciones en archivo JSON para consulta manual
- ✅ Incluye endpoint GET /api/notificaciones para ver pendientes
- ✅ Health check en GET /api/health

**Endpoints disponibles:**

1. **Enviar notificación**
   ```bash
   POST http://127.0.0.1:3456/api/notificar-mensualidad
   
   Body:
   {
     "mensaje": "Tu mensualidad vence en 3 días",
     "monto": 500.00,
     "fecha_vencimiento": "2025-02-15",
     "timestamp": "2025-02-12T10:30:00"
   }
   ```

2. **Consultar notificaciones pendientes**
   ```bash
   GET http://127.0.0.1:3456/api/notificaciones
   ```

3. **Health check**
   ```bash
   GET http://127.0.0.1:3456/api/health
   ```

**Prueba rápida:**
```bash
# Iniciar el servidor
python3 servidor_proxy_notificaciones.py

# En otra terminal, ejecutar el test
./test-notificacion.sh
```

## Roadmap de Solución

### Paso 1: Usar servidor proxy (ACTUAL)
- [x] Servidor Python funcional
- [x] Mismos endpoints y formato
- [x] Pruebas exitosas
- [ ] Usuario integra con su servidor externo

### Paso 2: Resolver compilación Rust (EN PROGRESO)
- [x] Limpiar cache de compilación
- [x] Actualizar versiones de dependencias
- [x] Simplificar estructura de estado
- [ ] Compilación exitosa
- [ ] Pruebas del endpoint integrado

### Paso 3: Migración final
Una vez que el servidor Rust compile correctamente:
- Detener servidor Python
- Las notificaciones funcionarán automáticamente con el servidor integrado
- Sin cambios necesarios en el código del servidor externo (mismo API)

## Integración con Servidor Externo

El script `recordatorio_automatico.py` ya está listo para producción y puede usarse con cualquiera de las dos opciones:

```bash
# Configurar como cron job
crontab -e

# Ejecutar cada día a las 9 AM
0 9 * * * /usr/bin/python3 /ruta/completa/recordatorio_automatico.py >> /var/log/notificaciones.log 2>&1
```

El script enviará notificaciones automáticamente según los días restantes hasta el vencimiento:
- **10+ días:** Recordatorio preventivo
- **3-7 días:** Recordatorio urgente
- **1-2 días:** Recordatorio muy urgente
- **0 días:** Pago vencido hoy

## Archivos del Sistema

```
estacionamiento-tienda/
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs                          # Servidor Rust (en compilación)
│   │   └── main.rs                         # Entry point
│   └── Cargo.toml                          # Dependencias
├── src/
│   └── components/
│       ├── NotificacionesMensualidad.tsx   # Componente React
│       └── Sidebar.tsx                     # Integración UI
├── servidor_proxy_notificaciones.py        # Servidor Python (FUNCIONAL)
├── recordatorio_automatico.py              # Sistema automatizado
├── test-notificacion.sh                    # Test con curl
├── test_notificacion.py                    # Tests completos
├── NOTIFICACIONES_API.md                   # Documentación API
└── NOTIFICACIONES_RESUMEN.md               # Guía rápida
```

## Recomendación

**Para uso inmediato:** Usar el servidor proxy Python (`servidor_proxy_notificaciones.py`)

**Para producción a largo plazo:** Esperar a que la compilación del servidor Rust termine y usar el servidor integrado

Ambas opciones usan exactamente el mismo API, por lo que no hay cambios necesarios en el código del servidor externo que envía las notificaciones.
