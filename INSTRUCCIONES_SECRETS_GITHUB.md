# 🔐 Configuración de Secrets en GitHub

Para que las actualizaciones automáticas funcionen, debes agregar estos secrets en tu repositorio de GitHub:

## 📋 Pasos para agregar los secrets:

1. Ve a tu repositorio: https://github.com/thenexusG98/estacionamiento-tienda

2. Haz clic en **Settings** (Configuración)

3. En el menú lateral, haz clic en **Secrets and variables** → **Actions**

4. Haz clic en **New repository secret**

5. Agrega los siguientes secrets:

### Secret 1: TAURI_SIGNING_PRIVATE_KEY

**Name:** `TAURI_SIGNING_PRIVATE_KEY`

**Value:** (Copia EXACTAMENTE este texto)
```
ZFc1MGNuVnpkR1ZrSUdOdmJXMWxiblE2SUhKemFXZHVJR1Z1WTNKNWNIUmxaQ0J6WldOeVpYUWdhMlY1Q2xKWFVsUlpNRWw1TlVWaFRqWXZabnBCV2tWS1NWSnJUVVJrVkRjcmVIRmlTWEZPY0hkM1psWlZWRTl0YlVKaldscHlUVUZCUWtGQlFVRkJRVUZCUVVGQlFVbEJRVUZCUVdaT2EwdG1iWEY0VVhSTlpGSnVaMFpuUTBRNEwxRXJSMnhMUW5wMU1tZENUazg1UkhOT1oxUlJNU3RVVFhWc1ltSm9SazQwVHpCemQwVlNSMDlEUzBsa1owdHpTR0ZWZW5oUWNHdHlhSGhpZFZJNFZqWndiV1JLV1dGWVdYTklWMHREVVVoRlJHcE5SamhQT0c5ME1ITmpTSGN6Y21wUmF6ZzRWVFp1YkhBck5rNDBkRmxYVlRSUmIyODlDZz09
```

---

### Secret 2: TAURI_SIGNING_PRIVATE_KEY_PASSWORD

**Name:** `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

**Value:** (La contraseña que ingresaste cuando generaste las llaves)

---

## ✅ Verificación

Una vez agregados los secrets, deberías ver:
- ✅ TAURI_SIGNING_PRIVATE_KEY
- ✅ TAURI_SIGNING_PRIVATE_KEY_PASSWORD

## 🚀 Próximos pasos

Después de agregar los secrets:

1. Haz commit y push de los cambios actuales
2. El workflow de GitHub Actions se ejecutará automáticamente
3. Se generarán los archivos de actualización firmados
4. Las aplicaciones instaladas verificarán automáticamente las actualizaciones cada 30 minutos

## 🔍 Notas importantes

- **NUNCA** compartas la llave privada ni la contraseña públicamente
- Si pierdes la llave privada o la contraseña, NO podrás firmar actualizaciones y tendrás que generar nuevas llaves
- Los usuarios con versiones firmadas con llaves antiguas NO podrán actualizarse a versiones con llaves nuevas
- Guarda una copia de seguridad de:
  - `~/.tauri/myapp.key` (llave privada)
  - `~/.tauri/myapp.key.pub` (llave pública)
  - La contraseña que usaste
