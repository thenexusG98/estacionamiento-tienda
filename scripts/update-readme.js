import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer package.json para obtener la versión
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// Obtener la fecha actual en formato DD/MM/YYYY
const now = new Date();
const dateStr = now.toLocaleDateString('es-MX', { 
  year: 'numeric', 
  month: '2-digit', 
  day: '2-digit' 
});

// Obtener los mensajes de commit desde el último tag
let commitMessages = '';
try {
  // Obtener el último tag
  const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', { encoding: 'utf8' }).trim();
  
  if (lastTag) {
    // Obtener commits desde el último tag
    const commits = execSync(`git log ${lastTag}..HEAD --pretty=format:"- %s"`, { encoding: 'utf8' }).trim();
    commitMessages = commits || 'Actualización de versión';
  } else {
    // Si no hay tags previos, obtener los últimos 5 commits
    const commits = execSync('git log -5 --pretty=format:"- %s"', { encoding: 'utf8' }).trim();
    commitMessages = commits || 'Versión inicial';
  }
} catch (error) {
  commitMessages = 'Actualización de versión';
}

// Filtrar commits que no sean útiles (como "chore: bump version")
const filteredCommits = commitMessages
  .split('\n')
  .filter(line => !line.includes('[skip ci]') && !line.includes('bump version'))
  .join('\n');

const changelogEntry = filteredCommits || '- Mejoras generales y correcciones';

// Leer README.md
const readmePath = path.join(__dirname, '../README.md');
let readmeContent = fs.readFileSync(readmePath, 'utf8');

// Actualizar la versión en la primera línea después del título
readmeContent = readmeContent.replace(
  /(\*\*Versión Actual:\s*)[\d.]+(\*\*)/,
  `$1${version}$2`
);

// Buscar la sección de Changelog y agregar la nueva versión
const changelogSection = `## 📋 Changelog

### v${version} - ${dateStr}
${changelogEntry}

<!-- El historial de versiones se actualiza automáticamente por GitHub Actions -->`;

// Reemplazar la sección de Changelog existente
readmeContent = readmeContent.replace(
  /## 📋 Changelog[\s\S]*?<!-- El historial de versiones se actualiza automáticamente por GitHub Actions -->/,
  changelogSection
);

// Guardar README.md actualizado
fs.writeFileSync(readmePath, readmeContent);

console.log(`✅ README.md actualizado con versión v${version}`);
console.log(`📅 Fecha: ${dateStr}`);
console.log(`📝 Cambios:\n${changelogEntry}`);
