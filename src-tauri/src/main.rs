#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
fn print_raw_usb(port: String, data: Vec<u8>) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::io::Write;

        let temp_path = std::env::temp_dir().join("ticket_pos_tmp.bin");

        let mut tmp = std::fs::File::create(&temp_path)
            .map_err(|e| format!("No se pudo crear archivo temporal: {}", e))?;
        tmp.write_all(&data)
            .map_err(|e| format!("Error al escribir datos ESC/POS: {}", e))?;
        drop(tmp);

        let port_arg = if port.trim().ends_with(':') {
            port.trim().to_uppercase()
        } else {
            format!("{}:", port.trim().to_uppercase())
        };

        let output = std::process::Command::new("cmd")
            .args(["/C", "copy", "/b",
                   temp_path.to_str().unwrap_or("ticket_pos_tmp.bin"),
                   &port_arg])
            .output()
            .map_err(|e| format!("Error al ejecutar copy: {}", e))?;

        let _ = std::fs::remove_file(&temp_path);

        if !output.status.success() {
            let out = String::from_utf8_lossy(&output.stdout);
            let err = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Error al enviar al puerto {}: {} {}", port_arg, out.trim(), err.trim()));
        }

        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    {
        use std::io::Write;
        let mut file = std::fs::OpenOptions::new()
            .write(true)
            .open(&port)
            .map_err(|e| format!("No se pudo abrir '{}': {}", port, e))?;
        file.write_all(&data)
            .map_err(|e| format!("Error al escribir en '{}': {}", port, e))?;
        Ok(())
    }
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
