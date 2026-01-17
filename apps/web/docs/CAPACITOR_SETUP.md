# Capacitor Setup Guide for WSL + Windows Android Studio

This guide documents the setup process for developing Capacitor Android apps when using WSL (Windows Subsystem for Linux) for development with Android Studio installed on Windows.

## Prerequisites

- WSL2 with Ubuntu
- Node.js installed in WSL
- Android Studio installed on Windows (e.g., `C:\Program Files\Android\Android Studio`)
- Physical Android device or Android Emulator

## 1. Install Capacitor Dependencies

```bash
cd apps/web
npm install @capacitor/core @capacitor/cli @capacitor/android
npm install @capacitor/push-notifications @capacitor/splash-screen @capacitor/status-bar
```

## 2. Create Capacitor Configuration

Create `capacitor.config.ts` in the web app root:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

// Development server IP configuration
// For emulator: use WSL IP (e.g., 172.20.160.237)
// For physical device: use Windows IP (e.g., 192.168.0.5)
const DEV_SERVER_IP = '192.168.0.5';

const config: CapacitorConfig = {
    appId: 'com.yourapp.app',
    appName: 'YourApp',
    webDir: 'out',
    server: {
        // For development, load from dev server
        // Comment this out for production builds
        url: `http://${DEV_SERVER_IP}:3000`,
        cleartext: true,
    },
    android: {
        allowMixedContent: true,
    },
    plugins: {
        PushNotifications: {
            presentationOptions: ['badge', 'sound', 'alert'],
        },
        SplashScreen: {
            launchShowDuration: 2000,
            launchAutoHide: true,
            backgroundColor: '#FFDE59',
            androidScaleType: 'CENTER_CROP',
            showSpinner: false,
            splashFullScreen: true,
            splashImmersive: true,
        },
    },
};

export default config;
```

## 3. Initialize Android Platform

```bash
npx cap add android
```

## 4. Configure Gradle for WSL

Android Studio on Windows cannot use the Windows JDK when the project is in WSL. You need to install JDK in WSL.

### Install JDK 21 in WSL

```bash
sudo apt update
sudo apt install -y openjdk-21-jdk
```

### Configure Gradle to Use WSL JDK

Edit `android/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx1536m
android.useAndroidX=true
org.gradle.java.home=/usr/lib/jvm/java-21-openjdk-amd64
```

## 5. Update Dev Server Configuration

Update `package.json` to bind Next.js to all interfaces:

```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0",
    "cap:sync": "npx cap sync",
    "cap:open:android": "npx cap open android",
    "cap:run:android": "npx cap run android"
  }
}
```

## 6. Network Configuration for Physical Device Testing

### Find Your IPs

**WSL IP:**
```bash
hostname -I | awk '{print $1}'
# Example: 172.20.160.237
```

**Windows IP:**
```powershell
# In PowerShell
ipconfig | findstr "IPv4"
# Example: 192.168.0.5
```

### Configure Port Forwarding (Windows PowerShell as Admin)

Forward port 3000 from Windows to WSL:

```powershell
# Add port forwarding rule
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=172.20.160.237

# Verify the rule
netsh interface portproxy show all

# To remove the rule later
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0
```

### Windows Firewall

Allow inbound connections on port 3000:

```powershell
New-NetFirewallRule -DisplayName "WSL Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

## 7. Running on Physical Device

### Using ADB from Windows

WSL cannot directly access USB devices. Use ADB from Windows PowerShell:

```powershell
# Navigate to ADB location
cd "C:\Users\YourUser\AppData\Local\Android\Sdk\platform-tools"

# Check connected devices
.\adb.exe devices

# If multiple devices, specify device ID
.\adb.exe -s YOUR_DEVICE_ID install path\to\app-debug.apk
```

### Building and Installing APK

1. In Android Studio, Build > Build Bundle(s) / APK(s) > Build APK(s)
2. APK located at: `android/app/build/outputs/apk/debug/app-debug.apk`
3. Install via ADB or transfer to device

## 8. App Icons

Generate icons for all density buckets. Place in `android/app/src/main/res/`:

| Density | Size | Directory |
|---------|------|-----------|
| mdpi | 48x48 | mipmap-mdpi |
| hdpi | 72x72 | mipmap-hdpi |
| xhdpi | 96x96 | mipmap-xhdpi |
| xxhdpi | 144x144 | mipmap-xxhdpi |
| xxxhdpi | 192x192 | mipmap-xxxhdpi |

### Generate Icons with ImageMagick

```bash
# From directory containing 1024x1024 source icon
for size in 48 72 96 144 192; do
  convert icon-1024.png -resize ${size}x${size} ic_launcher_${size}.png
done
```

## 9. Splash Screen

Create splash screens for all density/orientation combinations:

```bash
# Directories to create splash.png in:
drawable/
drawable-land-hdpi/
drawable-land-mdpi/
drawable-land-xhdpi/
drawable-land-xxhdpi/
drawable-land-xxxhdpi/
drawable-port-hdpi/
drawable-port-mdpi/
drawable-port-xhdpi/
drawable-port-xxhdpi/
drawable-port-xxxhdpi/
```

### Configure Splash Theme

Edit `android/app/src/main/res/values/styles.xml`:

```xml
<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
    <item name="android:background">@drawable/splash</item>
    <item name="android:windowBackground">@drawable/splash</item>
    <item name="android:statusBarColor">@color/splashBackground</item>
</style>
```

Edit `android/app/src/main/res/values/colors.xml`:

```xml
<resources>
    <color name="colorPrimary">#FFDE59</color>
    <color name="colorPrimaryDark">#E5C84F</color>
    <color name="colorAccent">#1a1a1a</color>
    <color name="splashBackground">#FFDE59</color>
</resources>
```

## Troubleshooting

### "Gradle JVM option is incorrect"
- Ensure JDK (not JRE) is installed in WSL
- Check `gradle.properties` has correct path to JDK

### "Invalid source release: 21"
- Install JDK 21: `sudo apt install openjdk-21-jdk`

### Device not showing in ADB
- Use Windows ADB, not WSL ADB
- Enable USB debugging on device
- Approve USB debugging prompt on device

### App shows blank screen on physical device
- Check port forwarding is configured
- Use Windows IP, not WSL IP in capacitor.config.ts
- Verify dev server is running on 0.0.0.0

### Splash screen shows Capacitor default
- Ensure splash.png exists in ALL drawable-* folders
- Run `npx cap sync` after adding splash images

## Development Workflow

1. Start dev server: `npm run dev`
2. Open Android Studio: `npx cap open android`
3. After code changes: `npx cap sync`
4. Build and run from Android Studio

## Production Build

1. Comment out `server` block in `capacitor.config.ts`
2. Build Next.js: `npm run build` (generates static export to `out/`)
3. Sync: `npx cap sync`
4. Build signed APK/AAB in Android Studio
