import type { CapacitorConfig } from '@capacitor/cli';

// Development server IP configuration
// For emulator: use WSL IP (172.20.160.237)
// For physical device: use Windows IP (192.168.0.5)
// For production: comment out the server block entirely
const DEV_SERVER_IP = '192.168.0.5'; // Windows IP for physical device

const config: CapacitorConfig = {
    appId: 'com.gellobit.app',
    appName: 'Gellobit',
    webDir: 'out',
    server: {
        // For development, load from WSL dev server
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
