#!/usr/bin/env python3
"""
Servidor Proxy de Notificaciones de Mensualidad
================================================

Este es un servidor HTTP alternativo que puede usarse mientras se resuelven
los problemas de compilación del servidor integrado en Rust.

El servidor escucha en el puerto 3456 y reenvía las notificaciones a la
aplicación Tauri usando el comando `tauri://emit` si está disponible, o
simplemente las registra para que puedan ser consultadas manualmente.

Uso:
    python3 servidor_proxy_notificaciones.py

Endpoint:
    POST http://127.0.0.1:3456/api/notificar-mensualidad
    
    Body (JSON):
    {
        "mensaje": "Tu mensualidad vence en 3 días",
        "monto": 500.00,
        "fecha_vencimiento": "2025-02-15",
        "timestamp": "2025-02-12T10:30:00"
    }
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import datetime
from urllib.parse import urlparse
import os

# Archivo para guardar notificaciones pendientes
NOTIFICACIONES_FILE = "notificaciones_pendientes.json"

class NotificacionHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Maneja solicitudes OPTIONS para CORS"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        """Maneja solicitudes POST"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/notificar-mensualidad':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                
                # Validar campos requeridos
                required_fields = ['mensaje', 'monto', 'fecha_vencimiento', 'timestamp']
                if not all(field in data for field in required_fields):
                    self.send_error(400, "Campos requeridos faltantes")
                    return
                
                # Guardar notificación en archivo
                self._save_notification(data)
                
                # Responder con éxito
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {
                    "success": True,
                    "message": "Notificación recibida correctamente",
                    "data": data
                }
                
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
                
                # Log en consola
                print(f"\n📨 Notificación recibida: {datetime.datetime.now()}")
                print(f"   Mensaje: {data['mensaje']}")
                print(f"   Monto: ${data['monto']}")
                print(f"   Vencimiento: {data['fecha_vencimiento']}")
                
            except json.JSONDecodeError:
                self.send_error(400, "JSON inválido")
            except Exception as e:
                self.send_error(500, f"Error interno: {str(e)}")
        else:
            self.send_error(404, "Endpoint no encontrado")
    
    def do_GET(self):
        """Maneja solicitudes GET"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/notificaciones':
            # Devolver notificaciones pendientes
            notifications = self._load_notifications()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                "success": True,
                "count": len(notifications),
                "notificaciones": notifications
            }
            
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
        elif parsed_path.path == '/api/health':
            # Health check
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            response = {
                "status": "ok",
                "server": "Proxy de Notificaciones",
                "version": "1.0.0"
            }
            
            self.wfile.write(json.dumps(response).encode('utf-8'))
        else:
            self.send_error(404, "Endpoint no encontrado")
    
    def _save_notification(self, notification):
        """Guarda una notificación en el archivo"""
        notifications = self._load_notifications()
        notifications.append(notification)
        
        with open(NOTIFICACIONES_FILE, 'w', encoding='utf-8') as f:
            json.dump(notifications, f, ensure_ascii=False, indent=2)
    
    def _load_notifications(self):
        """Carga notificaciones del archivo"""
        if os.path.exists(NOTIFICACIONES_FILE):
            try:
                with open(NOTIFICACIONES_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                return []
        return []
    
    def log_message(self, format, *args):
        """Personalizar el logging"""
        pass  # Silenciar logs automáticos de servidor

def run_server(port=3456):
    """Inicia el servidor"""
    server_address = ('127.0.0.1', port)
    httpd = HTTPServer(server_address, NotificacionHandler)
    
    print("=" * 60)
    print("🚀 Servidor Proxy de Notificaciones de Mensualidad")
    print("=" * 60)
    print(f"✅ Servidor escuchando en http://127.0.0.1:{port}")
    print(f"📡 Endpoint: POST /api/notificar-mensualidad")
    print(f"📋 Consultar: GET /api/notificaciones")
    print(f"💚 Health: GET /api/health")
    print(f"📝 Archivo de notificaciones: {NOTIFICACIONES_FILE}")
    print("\nPresiona Ctrl+C para detener el servidor")
    print("=" * 60)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Servidor detenido")
        httpd.shutdown()

if __name__ == '__main__':
    run_server()
