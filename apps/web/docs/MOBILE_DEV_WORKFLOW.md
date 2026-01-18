# Mobile Development Workflow

Guía rápida para desarrollo móvil con Capacitor en WSL + Windows.

## Requisitos Previos

- Android Studio instalado en Windows
- Teléfono con USB Debugging habilitado (Ajustes → Opciones de desarrollador → Depuración USB)
- Puerto 3000 con port forwarding configurado (ver sección de configuración inicial)

---

## Desarrollo en Teléfono Físico

### Paso 1: Conectar el teléfono

1. Conecta el teléfono por USB a la computadora
2. En el teléfono, acepta el prompt "¿Permitir depuración USB?"
3. Selecciona "Transferencia de archivos" en la notificación de USB

### Paso 2: Verificar conexión (PowerShell)

```powershell
cd "$env:LOCALAPPDATA\Android\Sdk\platform-tools"
.\adb devices
```

Deberías ver:
```
List of devices attached
WPG0217602001463    device
```

### Paso 3: Configurar IP para teléfono físico (WSL)

Edita `apps/web/capacitor.config.ts`:
```typescript
const DEV_SERVER_IP = '192.168.0.5'; // Windows IP for physical device
```

Sincroniza:
```bash
cd /home/huskerunix/gellobit-rss-nextjs/apps/web
npx cap sync
```

### Paso 4: Iniciar servidor de desarrollo (WSL)

```bash
cd /home/huskerunix/gellobit-rss-nextjs/apps/web
npm run dev
```

Verifica que inicie en el puerto 3000:
```
- Local:        http://localhost:3000
- Network:      http://0.0.0.0:3000
```

### Paso 5: Build APK (Android Studio)

1. Abre Android Studio
2. Menú: **Build → Generate App Bundles or APKs → Generate APKs**
3. Espera a que termine el build

### Paso 6: Instalar APK en teléfono (PowerShell)

```powershell
cd "$env:LOCALAPPDATA\Android\Sdk\platform-tools"
.\adb -s WPG0217602001463 install -r "\\wsl$\Ubuntu\home\huskerunix\gellobit-rss-nextjs\apps\web\android\app\build\outputs\apk\debug\app-debug.apk"
```

### Paso 7: Abrir la app

Abre la app "Gellobit" en tu teléfono. Debería cargar desde el servidor de desarrollo.

---

## Desarrollo en Emulador

### Paso 1: Configurar IP para emulador (WSL)

Edita `apps/web/capacitor.config.ts`:
```typescript
const DEV_SERVER_IP = '10.0.2.2'; // Android emulator special IP
```

Sincroniza:
```bash
cd /home/huskerunix/gellobit-rss-nextjs/apps/web
npx cap sync
```

### Paso 2: Iniciar servidor de desarrollo (WSL)

```bash
cd /home/huskerunix/gellobit-rss-nextjs/apps/web
npm run dev
```

### Paso 3: Iniciar emulador (Android Studio)

1. Abre Android Studio
2. Device Manager → Inicia un emulador

### Paso 4: Build e instalar APK

**Android Studio:**
Build → Generate App Bundles or APKs → Generate APKs

**PowerShell:**
```powershell
cd "$env:LOCALAPPDATA\Android\Sdk\platform-tools"
.\adb -s emulator-5554 install -r "\\wsl$\Ubuntu\home\huskerunix\gellobit-rss-nextjs\apps\web\android\app\build\outputs\apk\debug\app-debug.apk"
```

---

## Configuración Inicial (Solo una vez)

### Port Forwarding de Windows a WSL

En **PowerShell como Administrador**:

```powershell
# Agregar regla de port forwarding
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=172.20.160.237

# Verificar la regla
netsh interface portproxy show all

# Permitir en firewall
New-NetFirewallRule -DisplayName "WSL Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

**Nota:** Si la IP de WSL cambia (después de reiniciar), actualiza el port forwarding:

1. Obtén la nueva IP de WSL:
   ```bash
   hostname -I | awk '{print $1}'
   ```

2. Elimina la regla anterior y crea una nueva:
   ```powershell
   netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0
   netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=NUEVA_IP_WSL
   ```

---

## Troubleshooting

### Puerto 3000 ocupado

```bash
# Matar procesos en el puerto 3000
lsof -ti:3000 | xargs kill -9
```

### Teléfono no detectado por ADB

1. Desconecta y reconecta el cable USB
2. Verifica que USB Debugging esté habilitado
3. Acepta el prompt de depuración en el teléfono
4. Prueba otro puerto USB

### App muestra pantalla en blanco

1. Verifica que el servidor de desarrollo esté corriendo en puerto 3000
2. Verifica que el port forwarding esté configurado
3. Verifica que la IP en `capacitor.config.ts` sea correcta:
   - Teléfono físico: `192.168.0.5` (IP de Windows)
   - Emulador: `10.0.2.2`

### "unauthorized" en adb devices

Desbloquea el teléfono y acepta el prompt "¿Permitir depuración USB desde esta computadora?"

---

## IPs de Referencia

| Dispositivo | IP a usar en capacitor.config.ts |
|-------------|----------------------------------|
| Teléfono físico | `192.168.0.5` (IP de Windows) |
| Emulador Android | `10.0.2.2` (IP especial del host) |
| IP de WSL | `172.20.160.237` (puede cambiar) |

---

## Resumen de Comandos

| Acción | Dónde | Comando |
|--------|-------|---------|
| Iniciar servidor | WSL | `npm run dev` |
| Sincronizar Capacitor | WSL | `npx cap sync` |
| Ver dispositivos | PowerShell | `.\adb devices` |
| Instalar APK (teléfono) | PowerShell | `.\adb -s WPG0217602001463 install -r "ruta\al\apk"` |
| Instalar APK (emulador) | PowerShell | `.\adb -s emulator-5554 install -r "ruta\al\apk"` |
| Build APK | Android Studio | Build → Generate APKs |
