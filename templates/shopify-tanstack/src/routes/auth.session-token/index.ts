import { createFileRoute } from '@tanstack/react-router';
import { shopifyConfig } from '@/environment/configs/shopify.config.server';
import { shopifyBounceIframeProtectionMiddleware } from '@/modules/shopify';

export const Route = createFileRoute('/auth/session-token/')({
	server: {
		middleware: [shopifyBounceIframeProtectionMiddleware],
		handlers: {
			GET: () => {
				return new Response(createSessionTokenBounceHtml(), {
					headers: {
						'Cache-Control': 'no-store',
						'Content-Type': 'text/html; charset=utf-8'
					}
				});
			}
		}
	}
});

// Note: App Bridge replaces `shopify-reload` with a fresh `id_token` before returning to the app
// https://shopify.dev/docs/apps/build/authentication-authorization/implement-custom-authorization?extension=javascript#bounce-page-to-get-a-session-token-from-app-bridge
function createSessionTokenBounceHtml(): string {
	return `<!doctype html>
<html>
	<head>
		<meta name="shopify-api-key" content="${shopifyConfig.apiKey}" />
		<script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
	</head>
	<body></body>
</html>`;
}
