import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

// Shopify CLI still provides HOST, which Vite otherwise interprets as its bind address
if (
	process.env['HOST'] != null &&
	(process.env['SHOPIFY_APP_URL'] == null || process.env['SHOPIFY_APP_URL'] === process.env['HOST'])
) {
	process.env['SHOPIFY_APP_URL'] = process.env['HOST'];
	delete process.env['HOST'];
}

const appHost = new URL(process.env['SHOPIFY_APP_URL'] ?? 'http://localhost').hostname;
const appPort = Number(process.env['PORT'] ?? 3000);
const frontendPort = Number(process.env['FRONTEND_PORT'] ?? 8002);

// Shopify CLI proxies local HMR on a fixed port and tunneled HMR through HTTPS
const hmrConfig =
	appHost === 'localhost'
		? {
				protocol: 'ws' as const,
				host: 'localhost',
				port: 64999,
				clientPort: 64999
			}
		: {
				protocol: 'wss' as const,
				host: appHost,
				port: frontendPort,
				clientPort: 443
			};

export default defineConfig({
	resolve: {
		tsconfigPaths: true
	},
	server: {
		allowedHosts: [appHost],
		cors: {
			preflightContinue: true
		},
		port: appPort,
		hmr: hmrConfig
	},
	plugins: [
		tanstackStart({
			srcDirectory: 'src'
		}),
		nitro(),
		viteReact(),
		tailwindcss()
	]
});
