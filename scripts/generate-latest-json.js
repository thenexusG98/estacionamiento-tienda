import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer la versión del package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// Detectar si estamos en rama de test basado en NEW_TAG del environment
const newTag = process.env.NEW_TAG || `v${version}`;

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

// Función para encontrar todos los archivos con cierta extensión
function findAllFiles(dir, extension) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir);
  return files.filter(f => f.endsWith(extension)).map(f => path.join(dir, f));
}

// Función para obtener la firma del archivo .sig
function getSignature(sigPath) {
  if (!fs.existsSync(sigPath)) return '';
  return fs.readFileSync(sigPath, 'utf8').trim();
}

// Buscar actualizaciones para Linux (.AppImage)
const appImageDir = path.join(targetDir, 'appimage');
// Primero buscar el formato v1Compatible (.tar.gz)
let appImageFile = findFile(appImageDir, '.AppImage.tar.gz');
let appImageSig = findFile(appImageDir, '.AppImage.tar.gz.sig');

// Si no existe formato v1Compatible, usar el .AppImage directo con firma
if (!appImageFile || !appImageSig) {
  appImageFile = findFile(appImageDir, '.AppImage');
  appImageSig = findFile(appImageDir, '.AppImage.sig');
}

// Buscar actualizaciones para Windows (.msi)
const msiDir = path.join(targetDir, 'msi');
// Primero buscar el formato v1Compatible (.zip)
let msiFile = findFile(msiDir, '.msi.zip');
let msiSig = findFile(msiDir, '.msi.zip.sig');

// Si no existe formato v1Compatible, usar el .msi directo con firma
if (!msiFile || !msiSig) {
  msiFile = findFile(msiDir, '.msi');
  msiSig = findFile(msiDir, '.msi.sig');
}

// Si encontramos el archivo MSI, usarlo (con o sin firma)
if (msiFile) {
  const signature = msiSig ? getSignature(msiSig) : 'dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUldRa3d4VW1RTURvaHRPWGxuZnF4M2VYU1JNczc0RlNQU3FoYjVublZMZUkzQjdPVFlWb3htQVMK';
  platforms['windows-x86_64'] = {
    signature: signature,
    url: `https://github.com/thenexusG98/estacionamiento-tienda/releases/download/${newTag}/${path.basename(msiFile)}`
  };
  console.log('✅ Windows MSI updater artifact encontrado:', path.basename(msiFile));
  console.log('   Signature:', msiSig ? 'found' : 'using default');
} else {
  console.warn('⚠️ No se encontraron artifacts de actualización MSI para Windows');
  console.log('Archivos en msiDir:', fs.existsSync(msiDir) ? fs.readdirSync(msiDir) : 'directorio no existe');
}
// Buscar actualizaciones para Windows (.msi)
// Buscar actualizaciones para Windows NSIS (.exe)
const nsisDir = path.join(targetDir, 'nsis');
// Primero buscar el formato v1Compatible (.zip)
let nsisFile = findFile(nsisDir, '.nsis.zip');
let nsisSig = findFile(nsisDir, '.nsis.zip.sig');

// Si no existe formato v1Compatible, usar el .exe directo con firma
if (!nsisFile || !nsisSig) {
  nsisFile = findFile(nsisDir, '-setup.exe');
  nsisSig = findFile(nsisDir, '-setup.exe.sig');
}

// Si encontramos el archivo NSIS, usarlo (con o sin firma)
if (nsisFile) {
  // Si no hay MSI, usar NSIS como opción principal de Windows
  if (!platforms['windows-x86_64']) {
    const signature = nsisSig ? getSignature(nsisSig) : 'dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUldRa3d4VW1RTURvaHRPWGxuZnF4M2VYU1JNczc0RlNQU3FoYjVublZMZUkzQjdPVFlWb3htQVMK';
    platforms['windows-x86_64'] = {
      signature: signature,
      url: `https://github.com/thenexusG98/estacionamiento-tienda/releases/download/${newTag}/${path.basename(nsisFile)}`
    };
    console.log('✅ Windows NSIS updater artifact encontrado:', path.basename(nsisFile));
    console.log('   Signature:', nsisSig ? 'found' : 'using default');
  }
} else {
  if (!platforms['windows-x86_64']) {
    console.warn('⚠️ No se encontraron artifacts de actualización NSIS para Windows');
    console.log('Archivos en nsisDir:', fs.existsSync(nsisDir) ? fs.readdirSync(nsisDir) : 'directorio no existe');
  }
}onst nsisFile = findFile(nsisDir, '.nsis.zip');
const nsisSig = findFile(nsisDir, '.nsis.zip.sig');

if (nsisFile && nsisSig) {
  // Si no hay MSI, usar NSIS como opción principal de Windows
  if (!platforms['windows-x86_64']) {
    platforms['windows-x86_64'] = {
      signature: getSignature(nsisSig),
      url: `https://github.com/thenexusG98/estacionamiento-tienda/releases/download/${newTag}/${path.basename(nsisFile)}`
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
