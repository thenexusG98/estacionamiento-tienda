// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

/// Envía bytes ESC/POS a la impresora usando la API de spooler de Windows.
/// `printer_name` es el nombre de la impresora TAL COMO aparece en
/// "Dispositivos e impresoras" (ej: "POS-5890U", "Generic / Text Only").
/// Usa OpenPrinter + WritePrinter con tipo de datos RAW, sin diálogos.
#[tauri::command]
fn print_raw_usb(printer_name: String, data: Vec<u8>) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    return print_via_spooler(&printer_name, &data);

    #[cfg(not(target_os = "windows"))]
    {
        // En Linux/macOS: escribir al device file (/dev/usb/lp0, etc.)
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

/// Implementación Windows: OpenPrinter -> StartDocPrinter(RAW) -> WritePrinter -> ClosePrinter
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

    // Convertir nombre de impresora a UTF-16
    let w_name: Vec<u16> = OsStr::new(printer_name)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    let w_doc: Vec<u16> = OsStr::new("Ticket ESC/POS")
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    let w_raw: Vec<u16> = OsStr::new("RAW")
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    unsafe {
        // 1) Abrir impresora por nombre
        let mut h_printer = ptr::null_mut();
        if OpenPrinterW(w_name.as_ptr() as *mut _, &mut h_printer, ptr::null_mut()) == 0 {
            let err = std::io::Error::last_os_error();
            return Err(format!(
                "No se pudo abrir la impresora '{}'. Verifica que el nombre coincida exactamente con el de 'Dispositivos e impresoras'. Error: {}",
                printer_name, err
            ));
        }

        // 2) Iniciar documento RAW
        let mut doc_info = DOC_INFO_1W {
            pDocName: w_doc.as_ptr() as *mut _,
            pOutputFile: ptr::null_mut(),
            pDatatype: w_raw.as_ptr() as *mut _,
        };
        let job_id = StartDocPrinterW(h_printer, 1, &mut doc_info as *mut _ as *mut _);
        if job_id == 0 {
            let err = std::io::Error::last_os_error();
            ClosePrinter(h_printer);
            return Err(format!("Error al iniciar trabajo de impresión: {}", err));
        }

        // 3) Iniciar página
        if StartPagePrinter(h_printer) == 0 {
            let err = std::io::Error::last_os_error();
            EndDocPrinter(h_printer);
            ClosePrinter(h_printer);
            return Err(format!("Error al iniciar página: {}", err));
        }

        // 4) Escribir bytes ESC/POS crudos
        let mut written: DWORD = 0;
        if WritePrinter(
            h_printer,
            data.as_ptr() as *mut _,
            data.len() as DWORD,
            &mut written,
        ) == 0 {
            let err = std::io::Error::last_os_error();
            EndPagePrinter(h_printer);
            EndDocPrinter(h_printer);
            ClosePrinter(h_printer);
            return Err(format!("Error al enviar datos ESC/POS: {}", err));
        }

        // 5) Finalizar
        EndPagePrinter(h_printer);
        EndDocPrinter(h_printer);
        ClosePrinter(h_printer);
    }
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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
