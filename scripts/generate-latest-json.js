import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer la versión del package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// Buscar los archivos de actualización generados por Tauri
const targetDir = path.join(__dirname, '../src-tauri/target/release/bundle');
const platforms = {};

// Función para encontrar archivos con cierta extensión
function findFile(dir, extension) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const file = files.find(f => f.endsWith(extension));
  return file ? path.join(dir, file) : null;
}

// Función para obtener la firma del archivo .sig
function getSignature(sigPath) {
  if (!fs.existsSync(sigPath)) return '';
  return fs.readFileSync(sigPath, 'utf8').trim();
}

// Buscar actualizaciones para Linux (.AppImage)
const appImageDir = path.join(targetDir, 'appimage');
const appImageFile = findFile(appImageDir, '.AppImage.tar.gz');
const appImageSig = findFile(appImageDir, '.AppImage.tar.gz.sig');

if (appImageFile && appImageSig) {
  platforms['linux-x86_64'] = {
    signature: getSignature(appImageSig),
    url: `https://github.com/thenexusG98/estacionamiento-tienda/releases/download/v${version}/${path.basename(appImageFile)}`
  };
}

// Buscar actualizaciones para Windows (.msi)
const msiDir = path.join(targetDir, 'msi');
const msiFile = findFile(msiDir, '.msi.zip');
const msiSig = findFile(msiDir, '.msi.zip.sig');

if (msiFile && msiSig) {
  platforms['windows-x86_64'] = {
    signature: getSignature(msiSig),
    url: `https://github.com/thenexusG98/estacionamiento-tienda/releases/download/v${version}/${path.basename(msiFile)}`
  };
}

// Buscar actualizaciones para Windows NSIS (.exe)
const nsisDir = path.join(targetDir, 'nsis');
const nsisFile = findFile(nsisDir, '.nsis.zip');
const nsisSig = findFile(nsisDir, '.nsis.zip.sig');

if (nsisFile && nsisSig) {
  // Si no hay MSI, usar NSIS como opción principal de Windows
  if (!platforms['windows-x86_64']) {
    platforms['windows-x86_64'] = {
      signature: getSignature(nsisSig),
      url: `https://github.com/thenexusG98/estacionamiento-tienda/releases/download/v${version}/${path.basename(nsisFile)}`
    };
  }
}

// Crear el objeto latest.json
const latest = {
  version: `v${version}`,
  notes: `Actualización automática a la versión ${version}`,
  pub_date: new Date().toISOString(),
  platforms
};

// Guardar en src-tauri/gen/latest.json
const genDir = path.join(__dirname, '../src-tauri/gen');
if (!fs.existsSync(genDir)) {
  fs.mkdirSync(genDir, { recursive: true });
}

const outputPath = path.join(genDir, 'latest.json');
fs.writeFileSync(outputPath, JSON.stringify(latest, null, 2));

console.log('✅ latest.json generado correctamente en:', outputPath);
console.log(JSON.stringify(latest, null, 2));
