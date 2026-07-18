import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const isReplit = process.env.REPL_ID !== undefined;
const isProduction = process.env.NODE_ENV === 'production';

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 3000;
const basePath = process.env.BASE_PATH || '/';

export default defineConfig(async () => {
  // process.cwd() is the package root when pnpm runs the build script
  const projectRoot = process.cwd();

  const plugins: import('vite').PluginOption[] = [
    react(),
    tailwindcss(),
  ];

  if (isReplit) {
    const { default: runtimeErrorOverlay } = await import(
      '@replit/vite-plugin-runtime-error-modal'
    );
    plugins.push(runtimeErrorOverlay());
  }

  if (!isProduction && isReplit) {
    const { cartographer } = await import('@replit/vite-plugin-cartographer');
    plugins.push(cartographer({ root: path.resolve(projectRoot, '..') }));
    const { devBanner } = await import('@replit/vite-plugin-dev-banner');
    plugins.push(devBanner());
  }

  return {
    base: basePath,
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(projectRoot, 'src'),
        '@assets': path.resolve(projectRoot, '..', '..', 'attached_assets'),
      },
      dedupe: ['react', 'react-dom'],
    },
    root: projectRoot,
    build: {
      outDir: path.resolve(projectRoot, 'dist/public'),
      emptyOutDir: true,
    },
    server: {
      port,
      strictPort: true,
      host: '0.0.0.0',
      allowedHosts: true,
      fs: {
        strict: true,
      },
    },
    preview: {
      port,
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
});
