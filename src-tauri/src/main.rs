#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
fn print_raw_usb(printer_name: String, data: Vec<u8>) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    return print_via_spooler(&printer_name, &data);

    #[cfg(not(target_os = "windows"))]
    {
        use std::io::Write;
        let mut file = std::fs::OpenOptions::new()
            .write(true)
            .open(&printer_name)
            .map_err(|e| format!("No se pudo abrir '{}': {}", printer_name, e))?;
        file.write_all(&data)
            .map_err(|e| format!("Error al escribir: {}", e))?;
        Ok(())
    }
}

#[cfg(target_os = "windows")]
fn print_via_spooler(printer_name: &str, data: &[u8]) -> Result<(), String> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use std::ptr;
    use winapi::shared::minwindef::DWORD;
    use winapi::um::winspool::{
        ClosePrinter, DOC_INFO_1W, EndDocPrinter, EndPagePrinter,
        OpenPrinterW, StartDocPrinterW, StartPagePrinter, WritePrinter,
    };

    let w_name: Vec<u16> = OsStr::new(printer_name).encode_wide().chain(std::iter::once(0)).collect();
    let w_doc:  Vec<u16> = OsStr::new("Ticket ESC/POS").encode_wide().chain(std::iter::once(0)).collect();
    let w_raw:  Vec<u16> = OsStr::new("RAW").encode_wide().chain(std::iter::once(0)).collect();

    unsafe {
        let mut h = ptr::null_mut();
        if OpenPrinterW(w_name.as_ptr() as *mut _, &mut h, ptr::null_mut()) == 0 {
            let e = std::io::Error::last_os_error();
            return Err(format!("No se pudo abrir '{}'. Verifica el nombre exacto en 'Dispositivos e impresoras'. Error: {}", printer_name, e));
        }
        let mut di = DOC_INFO_1W { pDocName: w_doc.as_ptr() as *mut _, pOutputFile: ptr::null_mut(), pDatatype: w_raw.as_ptr() as *mut _ };
        if StartDocPrinterW(h, 1, &mut di as *mut _ as *mut _) == 0 {
            let e = std::io::Error::last_os_error();
            ClosePrinter(h);
            return Err(format!("Error al iniciar trabajo: {}", e));
        }
        if StartPagePrinter(h) == 0 {
            let e = std::io::Error::last_os_error();
            EndDocPrinter(h); ClosePrinter(h);
            return Err(format!("Error al iniciar página: {}", e));
        }
        let mut written: DWORD = 0;
        if WritePrinter(h, data.as_ptr() as *mut _, data.len() as DWORD, &mut written) == 0 {
            let e = std::io::Error::last_os_error();
            EndPagePrinter(h); EndDocPrinter(h); ClosePrinter(h);
            return Err(format!("Error al enviar datos: {}", e));
        }
        EndPagePrinter(h); EndDocPrinter(h); ClosePrinter(h);
    }
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
