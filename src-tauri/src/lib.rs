// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

/// Devuelve la lista de impresoras instaladas en Windows vía PowerShell.
#[tauri::command]
fn list_printers() -> Vec<String> {
    let output = match std::process::Command::new("powershell")
        .args([
            "-NoProfile", "-NonInteractive", "-Command",
            "@(Get-Printer | Select-Object -ExpandProperty Name) | ConvertTo-Json -Compress",
        ])
        .output()
    {
        Ok(o) => o,
        Err(_) => return vec![],
    };

    let stdout = String::from_utf8_lossy(&output.stdout);
    let trimmed = stdout.trim();
    if trimmed.is_empty() {
        return vec![];
    }

    // ConvertTo-Json devuelve array ["a","b"] o string "a" si solo hay una impresora
    serde_json::from_str::<Vec<String>>(trimmed)
        .or_else(|_| serde_json::from_str::<String>(trimmed).map(|s| vec![s]))
        .unwrap_or_default()
}

/// Elimina todos los trabajos pendientes / en error de la cola de una impresora.
/// Recibe el nombre exacto como aparece en "Dispositivos e impresoras".
#[tauri::command]
fn purge_print_queue(printer_name: String) -> Result<String, String> {
    if printer_name.trim().is_empty() {
        return Err("Nombre de impresora vacío".to_string());
    }

    // Escapar comillas simples para PowerShell
    let safe = printer_name.trim().replace('\'', "''");
    let cmd = format!(
        "try {{ \
            $jobs = Get-PrintJob -PrinterName '{safe}' -ErrorAction SilentlyContinue; \
            if ($jobs) {{ $jobs | Remove-PrintJob; Write-Output \"Eliminados $($jobs.Count) trabajo(s)\" }} \
            else {{ Write-Output 'Sin trabajos pendientes' }} \
        }} catch {{ Write-Output $_.Exception.Message }}"
    );

    let output = std::process::Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", &cmd])
        .output()
        .map_err(|e| format!("Error al ejecutar PowerShell: {}", e))?;

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
     tauri::Builder::<tauri::Wry>::default()
        .plugin(tauri_plugin_opener::init::<tauri::Wry>())
        .plugin(tauri_plugin_sql::Builder::default().build::<tauri::Wry>())
        .plugin(tauri_plugin_shell::init::<tauri::Wry>())
        .plugin(tauri_plugin_fs::init::<tauri::Wry>())
        .plugin(tauri_plugin_dialog::init::<tauri::Wry>())
        .invoke_handler(tauri::generate_handler![list_printers, purge_print_queue])
        // Si usas updater:
        // .plugin(tauri_plugin_updater::init::<tauri::Wry>())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
