// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
     tauri::Builder::<tauri::Wry>::default()
        .plugin(tauri_plugin_opener::init::<tauri::Wry>())
        .plugin(tauri_plugin_sql::Builder::default().build::<tauri::Wry>())
        .plugin(tauri_plugin_shell::init::<tauri::Wry>())
        .plugin(tauri_plugin_fs::init::<tauri::Wry>())
        .plugin(tauri_plugin_dialog::init::<tauri::Wry>())
        // Si usas updater:
        // .plugin(tauri_plugin_updater::init::<tauri::Wry>())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
