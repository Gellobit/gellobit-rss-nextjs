# Guía: Compilar e Instalar APK en Teléfono Android

Esta guía explica cómo compilar la aplicación Gellobit y instalarla en un teléfono Android físico desde un entorno WSL2 + Windows.

---

## Requisitos Previos

- Android Studio instalado en Windows
- Teléfono Android con Depuración USB activada
- Cable USB de datos (no solo de carga)
- WSL2 con el proyecto clonado

---

## Configuración Inicial (Solo Primera Vez)

### 1. Habilitar Depuración USB en el teléfono

**Ubicación:** En tu teléfono Android

1. Ve a **Configuración** → **Acerca del teléfono**
2. Toca **Número de compilación** 7 veces (activa modo desarrollador)
3. Vuelve a **Configuración** → **Opciones de desarrollador**
4. Activa **Depuración USB**

### 2. Configurar Port Forwarding en Windows (para desarrollo con live reload)

**Terminal:** PowerShell como **Administrador**
**¿Mantener abierta?:** No, puedes cerrarla después

```powershell
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$(wsl hostname -I)
```

### 3. Abrir Firewall de Windows

**Terminal:** PowerShell como **Administrador**
**¿Mantener abierta?:** No, puedes cerrarla después

```powershell
netsh advfirewall firewall add rule name="Next.js Dev" dir=in action=allow protocol=TCP localport=3000
```

---

## Proceso de Compilación e Instalación

### Paso 1: Conectar el teléfono

1. Conecta el teléfono al PC con cable USB
2. En el teléfono, selecciona modo **"Transferencia de archivos (MTP)"** en la notificación de USB
3. Si aparece diálogo de "Permitir depuración USB", toca **Permitir** y marca "Siempre permitir"

---

### Paso 2: Iniciar servidor ADB

**Terminal:** PowerShell (normal, no administrador)
**¿Mantener abierta?:** Sí, mantener abierta para los siguientes pasos

```powershell
cd "$env:LOCALAPPDATA\Android\Sdk\platform-tools"
```

```powershell
.\adb kill-server
```

```powershell
.\adb start-server
```

---

### Paso 3: Verificar que el teléfono esté detectado

**Terminal:** PowerShell (la misma del paso anterior)
**¿Mantener abierta?:** Sí

```powershell
.\adb devices
```

**Resultado esperado:**
```
List of devices attached
WPG0217602001463        device
```

> **Nota:** El número `WPG0217602001463` es el ID de tu teléfono. Anótalo para usarlo en los siguientes pasos.

**Si aparece `unauthorized`:**
- Revisa la pantalla del teléfono
- Acepta el diálogo de "Permitir depuración USB"
- Vuelve a ejecutar `.\adb devices`

**Si no aparece ningún dispositivo:**
- Verifica que el cable sea de datos, no solo de carga
- Verifica que el modo USB sea "Transferencia de archivos"
- Desconecta y reconecta el cable

---

### Paso 4: Compilar el APK

**Terminal:** WSL (Ubuntu)
**¿Mantener abierta?:** No, puedes cerrarla después de que termine

```bash
cd /home/huskerunix/gellobit-rss-nextjs/apps/web/android && ./gradlew assembleDebug
```

**Tiempo estimado:** 1-3 minutos la primera vez, más rápido en compilaciones posteriores.

**Resultado:** El APK se genera en:
```
/home/huskerunix/gellobit-rss-nextjs/apps/web/android/app/build/outputs/apk/debug/app-debug.apk
```

---

### Paso 5: Instalar APK en el teléfono

**Terminal:** PowerShell (desde platform-tools)
**¿Mantener abierta?:** No

**Primero, asegúrate de estar en el directorio correcto:**
```powershell
cd "$env:LOCALAPPDATA\Android\Sdk\platform-tools"
```

**Luego, instala el APK (TODO EN UNA SOLA LÍNEA):**
```powershell
.\adb -s WPG0217602001463 install -r "\\wsl$\Ubuntu\home\huskerunix\gellobit-rss-nextjs\apps\web\android\app\build\outputs\apk\debug\app-debug.apk"
```

> **IMPORTANTE:** Reemplaza `WPG0217602001463` con el ID de tu teléfono obtenido en el Paso 3.

**Resultado esperado:**
```
Performing Streamed Install
Success
```

---

## Desarrollo con Live Reload (Opcional)

Si quieres ver los cambios en tiempo real mientras desarrollas:

### Paso 1: Iniciar servidor de desarrollo

**Terminal:** WSL
**¿Mantener abierta?:** **SÍ, debe quedarse abierta mientras desarrollas**

```bash
cd /home/huskerunix/gellobit-rss-nextjs/apps/web && npm run dev
```

### Paso 2: Verificar configuración de Capacitor

El archivo `apps/web/capacitor.config.ts` debe tener la IP de Windows:

```typescript
const DEV_SERVER_IP = '192.168.0.5'; // Tu IP de Windows
```

Para obtener tu IP de Windows:

**Terminal:** PowerShell
**¿Mantener abierta?:** No

```powershell
ipconfig | findstr /i "IPv4"
```

### Paso 3: Sincronizar y ejecutar

**Terminal:** WSL
**¿Mantener abierta?:** Sí, para ver logs

```bash
cd /home/huskerunix/gellobit-rss-nextjs/apps/web && npx cap sync android
```

---

## Comandos Útiles

### Ver logs del teléfono en tiempo real

**Terminal:** PowerShell (desde platform-tools)
**¿Mantener abierta?:** Sí, mientras quieras ver logs

```powershell
cd "$env:LOCALAPPDATA\Android\Sdk\platform-tools"
.\adb logcat | Select-String "Gellobit"
```

### Desinstalar la app del teléfono

**Terminal:** PowerShell (desde platform-tools)
**¿Mantener abierta?:** No

```powershell
cd "$env:LOCALAPPDATA\Android\Sdk\platform-tools"
.\adb -s WPG0217602001463 uninstall com.gellobit.app
```

### Reiniciar ADB si hay problemas

**Terminal:** PowerShell (desde platform-tools)
**¿Mantener abierta?:** No

```powershell
cd "$env:LOCALAPPDATA\Android\Sdk\platform-tools"
.\adb kill-server
.\adb start-server
.\adb devices
```

---

## Solución de Problemas

### "adb is not recognized"
Estás en el directorio equivocado. Ejecuta primero:
```powershell
cd "$env:LOCALAPPDATA\Android\Sdk\platform-tools"
```

### "unauthorized" en adb devices
Revisa la pantalla del teléfono y acepta el diálogo de depuración USB.

### No aparece ningún dispositivo
1. Verifica que el cable USB sea de datos
2. Cambia el modo USB a "Transferencia de archivos"
3. Reinicia el servidor ADB con `.\adb kill-server` y `.\adb start-server`

### "INSTALL_FAILED_UPDATE_INCOMPATIBLE"
La app ya está instalada con una firma diferente. Desinstálala primero:
```powershell
.\adb -s WPG0217602001463 uninstall com.gellobit.app
```

### La app no conecta al servidor de desarrollo
1. Verifica que el servidor esté corriendo en WSL
2. Verifica que la IP en `capacitor.config.ts` sea correcta
3. Verifica que el teléfono esté en la misma red WiFi
4. Verifica que el firewall de Windows permita el puerto 3000

---

## Resumen de Terminales

| Paso | Terminal | ¿Administrador? | ¿Mantener abierta? |
|------|----------|-----------------|-------------------|
| Port forwarding | PowerShell | Sí | No |
| Firewall | PowerShell | Sí | No |
| ADB commands | PowerShell | No | Sí (mientras trabajas) |
| Compilar APK | WSL | N/A | No |
| Servidor dev | WSL | N/A | Sí (mientras desarrollas) |

---

## IDs y Rutas Importantes

- **ID del teléfono:** `WPG0217602001463` (puede variar, verificar con `adb devices`)
- **Ruta APK:** `\\wsl$\Ubuntu\home\huskerunix\gellobit-rss-nextjs\apps\web\android\app\build\outputs\apk\debug\app-debug.apk`
- **Directorio platform-tools:** `$env:LOCALAPPDATA\Android\Sdk\platform-tools`
- **Directorio proyecto en WSL:** `/home/huskerunix/gellobit-rss-nextjs/apps/web`
