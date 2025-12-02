#!/usr/bin/env python3
"""
Script de prueba para enviar notificaciones de mensualidad
al sistema de estacionamiento.

Uso:
    python3 test_notificacion.py
"""

import requests
from datetime import datetime, timedelta
import json

def enviar_notificacion_mensualidad(
    mensaje: str,
    monto: float,
    dias_vencimiento: int = 5
) -> bool:
    """
    Envía una notificación de mensualidad al sistema.
    
    Args:
        mensaje: Mensaje de la notificación
        monto: Monto a pagar
        dias_vencimiento: Días hasta el vencimiento
        
    Returns:
        True si se envió correctamente, False en caso contrario
    """
    url = 'http://127.0.0.1:3456/api/notificar-mensualidad'
    
    fecha_vencimiento = datetime.now() + timedelta(days=dias_vencimiento)
    
    payload = {
        'mensaje': mensaje,
        'monto': monto,
        'fecha_vencimiento': fecha_vencimiento.strftime('%Y-%m-%d'),
        'timestamp': datetime.now().isoformat()
    }
    
    try:
        print(f"📤 Enviando notificación...")
        print(f"   Mensaje: {mensaje}")
        print(f"   Monto: ${monto}")
        print(f"   Vencimiento: {fecha_vencimiento.strftime('%d/%m/%Y')}")
        print()
        
        response = requests.post(url, json=payload, timeout=5)
        response.raise_for_status()
        
        result = response.json()
        
        if result.get('success'):
            print('✅ Notificación enviada correctamente')
            print(f'📨 Respuesta: {result.get("message")}')
            return True
        else:
            print('❌ Error en la respuesta del servidor')
            print(f'   {result}')
            return False
            
    except requests.exceptions.ConnectionError:
        print('❌ No se pudo conectar al servidor')
        print('🔍 Verifica que la aplicación esté corriendo')
        return False
    except requests.exceptions.Timeout:
        print('⏱️ Timeout - El servidor no respondió a tiempo')
        return False
    except requests.exceptions.RequestException as e:
        print(f'❌ Error al enviar notificación: {e}')
        return False
    except Exception as e:
        print(f'❌ Error inesperado: {e}')
        return False


def main():
    """Función principal"""
    print("="*60)
    print("🧪 PRUEBA DE NOTIFICACIONES DE MENSUALIDAD")
    print("="*60)
    print()
    
    # Caso 1: Notificación urgente (3 días)
    print("📍 Caso 1: Notificación urgente")
    print("-" * 60)
    enviar_notificacion_mensualidad(
        mensaje="⚠️ URGENTE: Tu mensualidad vence en 3 días. Realiza el pago para evitar suspensión del servicio.",
        monto=500.00,
        dias_vencimiento=3
    )
    print()
    
    # Caso 2: Recordatorio normal (7 días)
    print("📍 Caso 2: Recordatorio normal")
    print("-" * 60)
    enviar_notificacion_mensualidad(
        mensaje="💳 Recordatorio: Tu mensualidad vence en 7 días. Por favor realiza el pago.",
        monto=500.00,
        dias_vencimiento=7
    )
    print()
    
    # Caso 3: Notificación anticipada (15 días)
    print("📍 Caso 3: Notificación anticipada")
    print("-" * 60)
    enviar_notificacion_mensualidad(
        mensaje="📅 Tu mensualidad vence en 15 días. Puedes realizar el pago anticipado.",
        monto=500.00,
        dias_vencimiento=15
    )
    print()
    
    print("="*60)
    print("✨ Pruebas completadas")
    print("👀 Revisa la aplicación - deberías ver 3 notificaciones")
    print("="*60)


if __name__ == '__main__':
    main()
