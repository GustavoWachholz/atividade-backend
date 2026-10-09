import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Mantém as artes já aprovadas como arquivos públicos, sem duplicá-las.
export default defineConfig({
  plugins: [react()],
  publicDir: 'assets'
});
