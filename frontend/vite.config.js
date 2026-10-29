import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Mantém as artes já aprovadas como arquivos públicos, sem duplicá-las.
export default defineConfig({
  plugins: [react()],
  publicDir: 'assets',
  // O front chama /api no próprio endereço e o Vite repassa ao backend da máquina,
  // assim o celular na mesma rede alcança a API sem expor a porta 8000.
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        rewrite: (caminho) => caminho.replace(/^\/api/, '')
      }
    }
  }
});
