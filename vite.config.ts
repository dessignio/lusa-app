import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // --- AÑADE ESTA SECCIÓN ---
      server: {
        // Permite que Vite sea accesible desde tu red local y ngrok
        host: true, 
        
        // Permite explícitamente las URLs de ngrok
        // El punto al principio funciona como un comodín (*.ngrok-free.app)
        allowedHosts: ['.ngrok-free.app'], 
      }
      // -------------------------
    };
});