import { defineConfig } from 'astro/config';
import { SITE_URL } from './src/config/site';

export default defineConfig({
  output: 'static',
  site: SITE_URL,
  trailingSlash: 'always',
});
