#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::Write;

#[tauri::command]
fn print_raw_usb(port: String, data: Vec<u8>) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    let device_path = format!("\\\\.\\{}", port.trim_end_matches(':'));

    #[cfg(not(target_os = "windows"))]
    let device_path = port.clone();

    let mut file = std::fs::OpenOptions::new()
        .write(true)
        .open(&device_path)
        .map_err(|e| format!("No se pudo abrir '{}': {}", device_path, e))?;

    file.write_all(&data)
        .map_err(|e| format!("Error al escribir en '{}': {}", device_path, e))?;

    Ok(())
}

fn main() {
    tauri::Builder::<tauri::Wry>::default()
        .plugin(tauri_plugin_opener::init::<tauri::Wry>())
        .plugin(tauri_plugin_sql::Builder::default().build::<tauri::Wry>())
        .plugin(tauri_plugin_shell::init::<tauri::Wry>())
        .plugin(tauri_plugin_fs::init::<tauri::Wry>())
        .plugin(tauri_plugin_dialog::init::<tauri::Wry>())
        .invoke_handler(tauri::generate_handler![print_raw_usb])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
