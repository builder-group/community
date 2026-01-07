import mdx from '@mdx-js/rollup';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';

// https://vite.dev/config/
export default defineConfig(async () => ({
	server: {
		port: 3000
	},
	plugins: [
		tsConfigPaths({
			projects: ['./tsconfig.json']
		}),
		mdx(),
		tanstackStart({
			srcDirectory: 'src'
		}),
		nitro(),
		viteReact(),
		tailwindcss()
	]
}));
