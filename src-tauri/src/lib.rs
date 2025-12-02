// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use tauri::{Manager, Emitter};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use axum::{
    extract::State,
    routing::post,
    Json, Router,
};
use tower_http::cors::CorsLayer;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificacionMensualidad {
    pub mensaje: String,
    pub monto: f64,
    pub fecha_vencimiento: String,
    pub timestamp: String,
}

// Estado compartido para almacenar notificaciones
#[derive(Clone)]
pub struct AppState {
    pub notificaciones: Arc<Mutex<Vec<NotificacionMensualidad>>>,
    pub app_handle: tauri::AppHandle,
}

// Comando Tauri para obtener notificaciones pendientes
#[tauri::command]
async fn obtener_notificaciones_pendientes(
    state: tauri::State<'_, Arc<Mutex<Vec<NotificacionMensualidad>>>>,
) -> Result<Vec<NotificacionMensualidad>, String> {
    let notificaciones = state.lock().await;
    Ok(notificaciones.clone())
}

// Comando Tauri para marcar una notificación como leída
#[tauri::command]
async fn marcar_notificacion_leida(
    state: tauri::State<'_, Arc<Mutex<Vec<NotificacionMensualidad>>>>,
    index: usize,
) -> Result<(), String> {
    let mut notificaciones = state.lock().await;
    if index < notificaciones.len() {
        notificaciones.remove(index);
        Ok(())
    } else {
        Err("Índice inválido".to_string())
    }
}

// Función para iniciar el servidor HTTP
async fn iniciar_servidor_http(state: AppState) {
    println!("🔧 Iniciando servidor HTTP de notificaciones...");
    
    let app = Router::new()
        .route("/api/notificar-mensualidad", post(recibir_notificacion_mensualidad))
        .layer(CorsLayer::permissive())
        .with_state(state);

    println!("🔌 Intentando abrir puerto 3456...");
    
    let listener = match tokio::net::TcpListener::bind("127.0.0.1:3456").await {
        Ok(l) => {
            println!("✅ Puerto 3456 abierto exitosamente");
            l
        }
        Err(e) => {
            eprintln!("❌ Error al abrir puerto 3456: {}", e);
            return;
        }
    };

    println!("🚀 Servidor HTTP escuchando en http://127.0.0.1:3456");

    if let Err(e) = axum::serve(listener, app).await {
        eprintln!("❌ Error al ejecutar el servidor: {}", e);
    }
}

// Handler para recibir notificaciones de mensualidad
async fn recibir_notificacion_mensualidad(
    State(state): State<AppState>,
    Json(payload): Json<NotificacionMensualidad>,
) -> Json<serde_json::Value> {
    println!("📨 Notificación recibida: {:?}", payload);

    // Agregar notificación al estado
    let mut notificaciones = state.notificaciones.lock().await;
    notificaciones.push(payload.clone());
    drop(notificaciones); // Liberar el lock antes de emitir

    // Emitir evento al frontend
    let _ = state.app_handle.emit("nueva-notificacion-mensualidad", payload);

    Json(serde_json::json!({
        "success": true,
        "message": "Notificación recibida correctamente"
    }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::<tauri::Wry>::default()
        .plugin(tauri_plugin_opener::init::<tauri::Wry>())
        .plugin(tauri_plugin_sql::Builder::default().build::<tauri::Wry>())
        .plugin(tauri_plugin_shell::init::<tauri::Wry>())
        .plugin(tauri_plugin_fs::init::<tauri::Wry>())
        .plugin(tauri_plugin_dialog::init::<tauri::Wry>())
        .setup(|app| {
            // Inicializar estado compartido
            let notificaciones = Arc::new(Mutex::new(Vec::new()));
            app.manage(notificaciones.clone());

            // Crear estado para el servidor HTTP
            let http_state = AppState {
                notificaciones,
                app_handle: app.handle().clone(),
            };

            // Iniciar servidor HTTP en un task separado
            tauri::async_runtime::spawn(async move {
                iniciar_servidor_http(http_state).await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            obtener_notificaciones_pendientes,
            marcar_notificacion_leida
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}