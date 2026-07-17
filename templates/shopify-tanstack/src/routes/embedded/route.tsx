import type { SAppNavLinkAttributes } from '@shopify/app-bridge-types';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import {
	getPublicShopifyConfig,
	shopifyIframeProtectionMiddleware,
	shopifySessionTokenMiddleware
} from '@/modules/shopify';
import { ErrorPage } from './components';

export const Route = createFileRoute('/embedded')({
	server: {
		middleware: [shopifyIframeProtectionMiddleware, shopifySessionTokenMiddleware]
	},
	loader: () => getPublicShopifyConfig(),
	head: ({ loaderData }) => {
		if (loaderData == null) {
			throw new Error('Shopify configuration failed to load');
		}

		return {
			meta: [
				// Note: App Bridge reads the public Client ID from this meta tag when its CDN runtime initializes
				// https://shopify.dev/docs/api/app-home/apis
				{ name: 'shopify-api-key', content: loaderData.apiKey }
			],
			scripts: [
				{ src: 'https://cdn.shopify.com/shopifycloud/app-bridge.js' },
				{ src: 'https://cdn.shopify.com/shopifycloud/polaris.js' }
			]
		};
	},
	component: LayoutComponent,
	errorComponent: ErrorPage
});

function LayoutComponent() {
	return (
		<>
			<s-app-nav>
				<s-link
					// https://shopify.dev/docs/api/app-home/app-bridge-web-components/app-nav
					{...({
						href: '/embedded',
						rel: 'home'
					} satisfies SAppNavLinkAttributes)}
				>
					Home
				</s-link>
				<s-link href="/embedded/additional">Additional page</s-link>
			</s-app-nav>
			<Outlet />
		</>
	);
}
