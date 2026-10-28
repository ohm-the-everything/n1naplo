import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'org.n1naplo.app',
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
