import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import React from 'react';
import { appConfig } from '@/environment';
import styles from '../styles.css?url';

const getPublicAppConfig = createServerFn({ method: 'GET' }).handler(() => ({
	shopifyApiKey: process.env['SHOPIFY_API_KEY'] ?? ''
}));

export const Route = createRootRoute({
	loader: () => getPublicAppConfig(),
	head: ({ loaderData }) => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ name: 'shopify-api-key', content: loaderData?.shopifyApiKey ?? '' },
			{ title: appConfig.name }
		],
		links: [
			{
				rel: 'stylesheet',
				href: styles
			}
		],
		scripts: [
			{ src: 'https://cdn.shopify.com/shopifycloud/app-bridge.js' },
			{ src: 'https://cdn.shopify.com/shopifycloud/polaris.js' }
		]
	}),
	shellComponent: ShellComponent
});

function ShellComponent(props: { children: React.ReactNode }) {
	const { children } = props;

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<s-app-nav>
					<s-link href="/">Home</s-link>
				</s-app-nav>
				{children}
				{import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
				<Scripts />
			</body>
		</html>
	);
}
