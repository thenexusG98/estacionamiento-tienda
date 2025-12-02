#!/bin/bash

# Script para probar el endpoint de notificaciones de mensualidad
# Asegúrate de que la aplicación esté corriendo antes de ejecutar este script

echo "🧪 Probando endpoint de notificaciones..."
echo ""

# Enviar notificación de prueba
response=$(curl -s -X POST http://127.0.0.1:3456/api/notificar-mensualidad \
  -H "Content-Type: application/json" \
  -d '{
    "mensaje": "🔔 PRUEBA: Tu mensualidad del sistema vence en 5 días. Por favor realiza el pago.",
    "monto": 500.00,
    "fecha_vencimiento": "2025-12-07",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }')

echo "📨 Respuesta del servidor:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"
echo ""

if echo "$response" | grep -q '"success":true'; then
  echo "✅ Notificación enviada correctamente"
  echo "👀 Revisa la aplicación - deberías ver una campana con un contador"
else
  echo "❌ Error al enviar notificación"
  echo "🔍 Verifica que la aplicación esté corriendo"
fi
