import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(async () => ({
	resolve: {
		tsconfigPaths: true
	},
	server: {
		port: 3000
	},
	plugins: [
		tanstackStart({
			srcDirectory: 'src'
		}),
		nitro(),
		viteReact(),
		tailwindcss()
	]
}));
