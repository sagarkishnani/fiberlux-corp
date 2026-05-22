import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import tinaDirective from './astro-tina-directive/index.mjs';

export default defineConfig({
  integrations: [
    tailwind(),
    react(),
    tinaDirective(),
  ],
});
