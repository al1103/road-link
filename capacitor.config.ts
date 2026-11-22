import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.roadlink.navigation', appName: 'RoadLink', webDir: 'dist',
  ios: { contentInset: 'never', appendUserAgent: ' RoadLink/0.1' },
  plugins: { CapacitorHttp: { enabled: false } }
};
export default config;
