#!/usr/bin/env python3
"""
Sistema de recordatorios automáticos de mensualidad.

Este script se puede ejecutar con cron para enviar recordatorios
automáticos en fechas específicas.

Configuración de cron (ejemplos):
---------------------------------

# Recordatorio diario a las 9 AM
0 9 * * * /ruta/al/script/recordatorio_automatico.py

# Recordatorio cada 3 días a las 10 AM
0 10 */3 * * /ruta/al/script/recordatorio_automatico.py

# Recordatorio semanal los lunes a las 9 AM
0 9 * * 1 /ruta/al/script/recordatorio_automatico.py
"""

import requests
from datetime import datetime, timedelta
import sys
import logging

# Configuración
ENDPOINT_URL = 'http://127.0.0.1:3456/api/notificar-mensualidad'
MONTO_MENSUALIDAD = 500.00
FECHA_VENCIMIENTO = '2025-12-31'  # Cambiar a tu fecha real

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('notificaciones.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

def calcular_dias_restantes(fecha_vencimiento_str: str) -> int:
    """Calcula los días restantes hasta el vencimiento."""
    try:
        fecha_venc = datetime.strptime(fecha_vencimiento_str, '%Y-%m-%d')
        hoy = datetime.now()
        dias = (fecha_venc - hoy).days
        return dias
    except Exception as e:
        logging.error(f"Error al calcular días: {e}")
        return -1

def obtener_mensaje_segun_dias(dias_restantes: int) -> str:
    """Genera un mensaje apropiado según los días restantes."""
    if dias_restantes < 0:
        return f"❌ CRÍTICO: Tu mensualidad está vencida desde hace {abs(dias_restantes)} días. Contacta al administrador inmediatamente."
    elif dias_restantes == 0:
        return "⚠️ URGENTE: Tu mensualidad vence HOY. Realiza el pago de inmediato para evitar suspensión del servicio."
    elif dias_restantes <= 3:
        return f"🔴 MUY URGENTE: Tu mensualidad vence en {dias_restantes} día{'s' if dias_restantes > 1 else ''}. Realiza el pago lo antes posible."
    elif dias_restantes <= 7:
        return f"🟡 IMPORTANTE: Tu mensualidad vence en {dias_restantes} días. Por favor realiza el pago pronto."
    elif dias_restantes <= 15:
        return f"💳 Recordatorio: Tu mensualidad vence en {dias_restantes} días. Considera realizar el pago."
    else:
        return f"📅 Tu mensualidad vence en {dias_restantes} días. Puedes realizar el pago anticipado."

def enviar_recordatorio() -> bool:
    """Envía el recordatorio de mensualidad."""
    dias_restantes = calcular_dias_restantes(FECHA_VENCIMIENTO)
    
    if dias_restantes < 0:
        logging.warning(f"Mensualidad vencida hace {abs(dias_restantes)} días")
    
    mensaje = obtener_mensaje_segun_dias(dias_restantes)
    
    payload = {
        'mensaje': mensaje,
        'monto': MONTO_MENSUALIDAD,
        'fecha_vencimiento': FECHA_VENCIMIENTO,
        'timestamp': datetime.now().isoformat()
    }
    
    try:
        logging.info(f"Enviando recordatorio (días restantes: {dias_restantes})")
        
        response = requests.post(ENDPOINT_URL, json=payload, timeout=5)
        response.raise_for_status()
        
        result = response.json()
        
        if result.get('success'):
            logging.info(f"✅ Recordatorio enviado: {mensaje[:50]}...")
            return True
        else:
            logging.error(f"❌ Error en respuesta: {result}")
            return False
            
    except requests.exceptions.ConnectionError:
        logging.error("No se pudo conectar al servidor. ¿La aplicación está corriendo?")
        return False
    except requests.exceptions.Timeout:
        logging.error("Timeout al enviar recordatorio")
        return False
    except Exception as e:
        logging.error(f"Error inesperado: {e}")
        return False

def main():
    """Función principal."""
    logging.info("="*60)
    logging.info("🤖 SISTEMA DE RECORDATORIOS AUTOMÁTICOS")
    logging.info("="*60)
    
    dias_restantes = calcular_dias_restantes(FECHA_VENCIMIENTO)
    logging.info(f"📅 Fecha vencimiento: {FECHA_VENCIMIENTO}")
    logging.info(f"⏰ Días restantes: {dias_restantes}")
    logging.info(f"💰 Monto: ${MONTO_MENSUALIDAD}")
    
    # Solo enviar si faltan 30 días o menos (o ya venció)
    if dias_restantes <= 30:
        if enviar_recordatorio():
            logging.info("✨ Recordatorio procesado exitosamente")
            sys.exit(0)
        else:
            logging.error("❌ Fallo al enviar recordatorio")
            sys.exit(1)
    else:
        logging.info(f"⏭️ No es necesario enviar recordatorio (faltan {dias_restantes} días)")
        sys.exit(0)

if __name__ == '__main__':
    main()
