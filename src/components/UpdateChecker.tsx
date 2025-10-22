import { useEffect, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { ask } from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';

export default function UpdateChecker() {
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Verificar actualizaciones al iniciar la aplicación
    checkForUpdates();

    // Verificar actualizaciones cada 30 minutos
    const interval = setInterval(() => {
      checkForUpdates();
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const checkForUpdates = async () => {
    if (checking) return;

    try {
      setChecking(true);
      console.log('🔍 Verificando actualizaciones...');

      const update = await check();

      if (update) {
        console.log(`✨ Actualización disponible: ${update.version}`);
        console.log(`📅 Fecha: ${update.date}`);
        console.log(`📝 Notas: ${update.body}`);

        const yes = await ask(
          `Hay una nueva versión disponible: ${update.version}\n\n${update.body}\n\n¿Deseas actualizar ahora?`,
          {
            title: 'Actualización disponible',
            kind: 'info',
          }
        );

        if (yes) {
          console.log('⬇️ Descargando actualización...');
          
          await update.downloadAndInstall((event) => {
            switch (event.event) {
              case 'Started':
                console.log(`⬇️ Iniciando descarga de ${event.data.contentLength} bytes`);
                break;
              case 'Progress':
                console.log(`📦 Descargando: ${event.data.chunkLength} bytes`);
                break;
              case 'Finished':
                console.log('✅ Descarga completada');
                break;
            }
          });

          console.log('✅ Actualización instalada. Reiniciando...');
          
          await ask(
            'La actualización se ha instalado correctamente. La aplicación se reiniciará ahora.',
            {
              title: 'Actualización completada',
              kind: 'info',
            }
          );

          await relaunch();
        }
      } else {
        console.log('✅ La aplicación está actualizada');
      }
    } catch (error) {
      console.error('❌ Error al verificar actualizaciones:', error);
    } finally {
      setChecking(false);
    }
  };

  return null; // Este componente no renderiza nada
}
