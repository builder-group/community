import tailwindcss from '@tailwindcss/vite';
import tanstackRouter from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// eslint-disable-next-line turbo/no-undeclared-env-vars
const host = process.env['TAURI_DEV_HOST'];

// https://vite.dev/config/
export default defineConfig({
	resolve: {
		tsconfigPaths: true
	},
	plugins: [
		tanstackRouter({
			routesDirectory: './src/routes',
			generatedRouteTree: './src/routeTree.gen.ts',
			routeFileIgnorePrefix: '-',
			routeFileIgnorePattern: '.*(components|hooks|lib).*',
			quoteStyle: 'single'
		}),
		react(),
		tailwindcss()
	],

	// Vite options tailored for Tauri development
	clearScreen: false,
	server: {
		port: 1420,
		strictPort: true,
		host: host || false,
		hmr: host
			? {
					protocol: 'ws',
					host,
					port: 1421
				}
			: undefined,
		watch: {
			ignored: ['**/src-tauri/**']
		}
	}
});
