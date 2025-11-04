import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

console.log(`📦 Versión actual en package.json: ${version}`);

// Actualizar tauri.conf.json
const tauriConfPath = path.join(__dirname, '../src-tauri/tauri.conf.json');
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));

if (tauriConf.version !== version) {
  tauriConf.version = version;
  fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
  console.log(`✅ Actualizada versión en tauri.conf.json: ${version}`);
} else {
  console.log(`✓ tauri.conf.json ya tiene la versión correcta`);
}

// Actualizar Cargo.toml
const cargoTomlPath = path.join(__dirname, '../src-tauri/Cargo.toml');
let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');

// Reemplazar la versión en [package]
const versionRegex = /(\[package\][\s\S]*?version\s*=\s*)"[^"]*"/;
const newCargoToml = cargoToml.replace(versionRegex, `$1"${version}"`);

if (newCargoToml !== cargoToml) {
  fs.writeFileSync(cargoTomlPath, newCargoToml);
  console.log(`✅ Actualizada versión en Cargo.toml: ${version}`);
} else {
  console.log(`✓ Cargo.toml ya tiene la versión correcta`);
}

console.log(`\n🎉 Sincronización de versión completada: v${version}`);
