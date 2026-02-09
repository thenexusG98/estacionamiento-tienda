import { useEffect } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { ask } from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';

export function useUpdater() {
  useEffect(() => {
    // Verificar actualizaciones al iniciar la aplicación
    async function checkForUpdates() {
      try {
        console.log('🔍 Verificando actualizaciones...');
        
        // Verificar actualizaciones (incluye prereleases)
        const update = await check({
          // Forzar verificar todas las releases incluyendo prereleases
          // El updater de Tauri v2 automáticamente detecta si la versión actual
          // es de prerelease y busca en todas las releases
        });
        
        if (update) {
          console.log(`✅ Actualización disponible: ${update.version}`);
          console.log(`📝 Notas de la versión:\n${update.body}`);
          
          const yes = await ask(
            `¿Deseas actualizar a la versión ${update.version}?\n\n${update.body}`,
            {
              title: 'Actualización Disponible',
              kind: 'info',
            }
          );

          if (yes) {
            console.log('📥 Descargando e instalando actualización...');
            
            await update.downloadAndInstall();
            
            console.log('✅ Actualización instalada. Reiniciando aplicación...');
            
            await relaunch();
          }
        } else {
          console.log('ℹ️ La aplicación está actualizada');
        }
      } catch (error) {
        console.error('❌ Error al verificar actualizaciones:', error);
      }
    }

    // Ejecutar la verificación después de 3 segundos de que la app inicie
    const timeoutId = setTimeout(() => {
      checkForUpdates();
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, []);
}
