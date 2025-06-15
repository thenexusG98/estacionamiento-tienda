#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri_plugin_fs::init as init_fs;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(init_fs())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
