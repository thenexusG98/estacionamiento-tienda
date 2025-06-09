use rusqlite::{params, Connection, Result};
use tauri::Manager;

#[tauri::command]
fn registrar_venta(producto: String, cantidad: u32, precio_unitario: f64) -> Result<(), String> {
    let conn = Connection::open("data.db").map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS ventas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            producto TEXT NOT NULL,
            cantidad INTEGER NOT NULL,
            precio_unitario REAL NOT NULL,
            total REAL NOT NULL,
            fecha TEXT NOT NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    let total = (cantidad as f64) * precio_unitario;
    let fecha = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    conn.execute(
        "INSERT INTO ventas (producto, cantidad, precio_unitario, total, fecha)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![producto, cantidad, precio_unitario, total, fecha],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .invoke_handler(tauri::generate_handler![registrar_venta])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
