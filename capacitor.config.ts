import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'io.tanul.n1naplo',
  appName: 'N1 Napló',
  webDir: 'dist',
  // Papír-szín, hogy sose villanjon fehér/idegen háttér a webtartalom előtt.
  backgroundColor: '#FAF6EF',
  android: {
    backgroundColor: '#FAF6EF',
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#FAF6EF',
      launchAutoHide: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#FAF6EF',
    },
  },
}

export default config
