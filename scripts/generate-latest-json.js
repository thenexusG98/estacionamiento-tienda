import fs from 'fs';

const version = process.env.APP_VERSION || 'unknown';
const output = { version };

fs.writeFileSync('src-tauri/latest.json', JSON.stringify(output, null, 2));