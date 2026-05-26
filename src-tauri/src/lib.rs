// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use std::io::Write;

/// Escribe bytes ESC/POS directamente al puerto USB de la impresora.
/// En Windows el puerto se abre como \\.\USB001 (ruta de dispositivo).
/// En Linux/macOS se usa la ruta tal cual (ej: /dev/usb/lp0).
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
     tauri::Builder::<tauri::Wry>::default()
        .plugin(tauri_plugin_opener::init::<tauri::Wry>())
        .plugin(tauri_plugin_sql::Builder::default().build::<tauri::Wry>())
        .plugin(tauri_plugin_shell::init::<tauri::Wry>())
        .plugin(tauri_plugin_fs::init::<tauri::Wry>())
        .plugin(tauri_plugin_dialog::init::<tauri::Wry>())
        .invoke_handler(tauri::generate_handler![print_raw_usb])
        // Si usas updater:
        // .plugin(tauri_plugin_updater::init::<tauri::Wry>())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
