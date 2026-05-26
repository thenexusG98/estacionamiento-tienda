// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

/// Envía bytes ESC/POS al puerto USB de la impresora.
///
/// En Windows los puertos USB001/USB002 son administrados por el USB Print Monitor
/// y NO pueden abrirse con CreateFile (\\.\USB001 no existe como device path).
/// El método correcto y estándar en Windows es:
///   1. Escribir los bytes a un archivo temporal .bin
///   2. Ejecutar: cmd /c copy /b "temp.bin" USB002:
/// Esto envía los bytes crudos ESC/POS directamente al monitor sin el spooler de renderizado.
///
/// En Linux/macOS se escribe directo al device file (/dev/usb/lp0).
#[tauri::command]
fn print_raw_usb(port: String, data: Vec<u8>) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::io::Write;

        // Archivo temporal en %TEMP%
        let temp_path = std::env::temp_dir().join("ticket_pos_tmp.bin");

        // Escribir bytes ESC/POS al archivo
        let mut tmp = std::fs::File::create(&temp_path)
            .map_err(|e| format!("No se pudo crear archivo temporal: {}", e))?;
        tmp.write_all(&data)
            .map_err(|e| format!("Error al escribir datos ESC/POS: {}", e))?;
        drop(tmp);

        // Asegurar que el nombre del puerto termine en ':' (ej: USB002:)
        let port_arg = if port.trim().ends_with(':') {
            port.trim().to_uppercase()
        } else {
            format!("{}:", port.trim().to_uppercase())
        };

        // copy /b envia bytes raw al puerto, sin conversion ni spooler
        let output = std::process::Command::new("cmd")
            .args(["/C", "copy", "/b",
                   temp_path.to_str().unwrap_or("ticket_pos_tmp.bin"),
                   &port_arg])
            .output()
            .map_err(|e| format!("Error al ejecutar copy: {}", e))?;

        // Borrar archivo temporal (ignorar errores)
        let _ = std::fs::remove_file(&temp_path);

        if !output.status.success() {
            let out = String::from_utf8_lossy(&output.stdout);
            let err = String::from_utf8_lossy(&output.stderr);
            return Err(format!(
                "Error al enviar al puerto {}: {} {}",
                port_arg,
                out.trim(),
                err.trim()
            ));
        }

        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    {
        use std::io::Write;
        // En Linux: /dev/usb/lp0 | En macOS: /dev/cu.*
        let mut file = std::fs::OpenOptions::new()
            .write(true)
            .open(&port)
            .map_err(|e| format!("No se pudo abrir '{}': {}", port, e))?;
        file.write_all(&data)
            .map_err(|e| format!("Error al escribir en '{}': {}", port, e))?;
        Ok(())
    }
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
