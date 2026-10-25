import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.madhaq.factory',
  appName: 'MADHAQ مذاق',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#1c1917',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
