import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], server: { port: 5173, strictPort: true, watch: { ignored: ['**/.tools/**', '**/ios/**', '**/firmware/.pio/**', '**/test-results/**', '**/playwright-report/**'] },proxy:{'/api/interpreter':{target:'https://overpass-api.de',changeOrigin:true,headers:{'User-Agent':'RoadLink/0.1 (local navigation development)','Accept':'application/json'}}} } });
