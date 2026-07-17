import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import {
	createViteEnvDefine,
	emptyStringAsUndefined,
	portValidator,
	stringValidator,
	urlValidator,
	validateEnv
} from 'validatenv';
import { defineConfig } from 'vite';
import { z } from 'zod';

// Note: Shopify CLI still provides HOST, which Vite otherwise interprets as its bind address
// https://github.com/remix-run/remix/issues/2835#issuecomment-1144102176
const legacyShopifyAppUrl = emptyStringAsUndefined(process.env['HOST']);
const shopifyAppUrl = emptyStringAsUndefined(process.env['SHOPIFY_APP_URL']);
if (
	legacyShopifyAppUrl != null &&
	(shopifyAppUrl == null || shopifyAppUrl === legacyShopifyAppUrl)
) {
	process.env['SHOPIFY_APP_URL'] = legacyShopifyAppUrl;
	delete process.env['HOST'];
}

const environment = validateEnv(process.env, {
	appUrl: {
		envKey: 'SHOPIFY_APP_URL',
		validator: urlValidator,
		preprocess: emptyStringAsUndefined,
		defaultValue: 'http://localhost'
	},
	appPort: {
		envKey: 'PORT',
		validator: portValidator,
		preprocess: emptyStringAsUndefined,
		defaultValue: 3000
	},
	frontendPort: {
		envKey: 'FRONTEND_PORT',
		validator: portValidator,
		preprocess: emptyStringAsUndefined,
		defaultValue: 8002
	}
});

const appHost = new URL(environment.appUrl).hostname;

// Note: Shopify CLI proxies local HMR over a fixed WebSocket port and tunneled HMR over a secure
// WebSocket
// https://vite.dev/config/server-options.html#server-ws
const webSocketConfig =
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
				port: environment.frontendPort,
				clientPort: 443
			};

export default defineConfig(({ mode }) => {
	return {
		define: createViteEnvDefine(
			{
				...process.env,
				MODE: mode
			},
			{
				APP_ENVIRONMENT: {
					envKey: 'MODE',
					validator: z.enum(['development', 'production', 'test'])
				},
				PACKAGE_VERSION: {
					envKey: 'npm_package_version',
					validator: stringValidator,
					preprocess: emptyStringAsUndefined,
					defaultValue: '0.0.0'
				}
			}
		),
		resolve: {
			tsconfigPaths: true
		},
		server: {
			allowedHosts: [appHost],
			cors: {
				preflightContinue: true
			},
			port: environment.appPort,
			ws: webSocketConfig
		},
		plugins: [
			tanstackStart({
				srcDirectory: 'src',
				router: {
					routeFileIgnorePattern: '^(components|hooks|lib)$'
				}
			}),
			nitro(),
			viteReact(),
			tailwindcss()
		]
	};
});
