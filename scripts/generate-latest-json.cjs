const fs = require('fs');
const path = require('path');

const version = process.env.APP_VERSION;
const filename = `estacionamiento-tienda_${version}_x64_en-US.msi`;
const pubDate = new Date().toISOString();
const downloadUrl = `https://github.com/thenexusG98/estacionamiento-tienda/releases/download/${version}/${filename}`;

const latestJson = {
  version: version,
  notes: "Actualización automática generada desde GitHub Actions.",
  pub_date: pubDate,
  platforms: {
    "windows-x86_64": {
      signature: "trusted comment: el sistema aún no genera firmas reales",
      url: downloadUrl,
    },
  },
};

fs.writeFileSync('src-tauri/latest.json', JSON.stringify(latestJson, null, 2));
console.log(`✅ latest.json generado con versión ${version}`);
