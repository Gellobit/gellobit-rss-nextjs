# Desarrollo Android - Guía Rápida

## Requisitos previos
- Android Studio instalado en Windows
- Dispositivo Android conectado por USB con Depuración USB habilitada
- Cable USB de datos
- Teléfono en la misma red WiFi que el PC

---

## Configuración inicial (solo primera vez)

### 1. Obtener IP de WSL (en WSL)
```bash
hostname -I
```
Anota la IP (ej: `172.20.160.237`)

### 2. Configurar Port Forwarding (PowerShell como Admin)
```powershell
netsh interface portproxy add v4tov4 listenport=3000 connectaddress=172.20.160.237 connectport=3000 listenaddress=0.0.0.0
```
> Reemplaza `172.20.160.237` con tu IP de WSL

### 3. Abrir Firewall (PowerShell como Admin)
```powershell
netsh advfirewall firewall add rule name="Next.js Dev" dir=in action=allow protocol=TCP localport=3000
```

### 4. Configurar IP de Windows en Capacitor

Obtén tu IP de Windows (PowerShell):
```powershell
ipconfig | findstr /i "IPv4"
```

Edita `apps/web/capacitor.config.ts` línea 7:
```ts
const DEV_SERVER_IP = '192.168.0.5'; // Tu IP de Windows
```

---

## Iniciar desarrollo (3 pasos)

### Paso 1: Iniciar servidor web (WSL)
```bash
cd /home/huskerunix/gellobit-rss-nextjs/apps/web
npm run dev
```
> Mantener esta terminal abierta

### Paso 2: Compilar APK (WSL - otra terminal)
```bash
cd /home/huskerunix/gellobit-rss-nextjs/apps/web
npm run cap:sync
cd android && ./gradlew assembleDebug
```

### Paso 3: Instalar en dispositivo (PowerShell Windows)
```powershell
cd "$env:LOCALAPPDATA\Android\Sdk\platform-tools"
.\adb install -r "\\wsl$\Ubuntu\home\huskerunix\gellobit-rss-nextjs\apps\web\android\app\build\outputs\apk\debug\app-debug.apk"
```

Abre la app manualmente en el teléfono.

---

## Flujo de trabajo diario

| Cambio realizado | Acción necesaria |
|------------------|------------------|
| Código web (tsx, css) | Recarga automática en la app |
| Plugins nativos o config | Repetir Paso 2 y 3 |

---

## Si la IP de WSL cambia

La IP de WSL puede cambiar al reiniciar. Si la app no conecta:

**1. Obtener nueva IP (WSL):**
```bash
hostname -I
```

**2. Actualizar port forwarding (PowerShell Admin):**
```powershell
netsh interface portproxy reset
netsh interface portproxy add v4tov4 listenport=3000 connectaddress=NUEVA_IP connectport=3000 listenaddress=0.0.0.0
```

**3. Verificar:**
```powershell
netsh interface portproxy show all
```

---

## Comandos de referencia

### WSL
```bash
hostname -I                    # Ver IP de WSL
npm run dev                    # Servidor web
npm run cap:sync              # Sincronizar web → Android
cd android && ./gradlew assembleDebug  # Compilar APK
```

### PowerShell (desde platform-tools)
```powershell
cd "$env:LOCALAPPDATA\Android\Sdk\platform-tools"
.\adb devices                  # Ver dispositivos conectados
.\adb install -r "RUTA_APK"   # Instalar APK
.\adb logcat | Select-String "Gellobit"  # Ver logs
.\adb uninstall com.gellobit.app  # Desinstalar app
```

### PowerShell (Admin) - Red
```powershell
netsh interface portproxy show all   # Ver port forwarding
netsh interface portproxy reset      # Borrar port forwarding
```

---

## Solución de problemas

**App dice "no connection":**
1. Verifica que el servidor Next.js esté corriendo
2. Prueba `http://TU_IP_WINDOWS:3000` en el navegador del teléfono
3. Si no carga, revisa el port forwarding (la IP de WSL pudo cambiar)

**Dispositivo no aparece en `adb devices`:**
```powershell
.\adb kill-server
.\adb start-server
.\adb devices
```

**"unauthorized":** Acepta el diálogo en la pantalla del teléfono.
