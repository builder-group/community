import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import React from 'react';
import styles from '../styles.css?url';

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: 'utf-8'
			},
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1'
			}
		],
		links: [
			{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
			{
				rel: 'preconnect',
				href: 'https://fonts.gstatic.com',
				crossOrigin: 'anonymous'
			},
			{ rel: 'preconnect', href: 'https://api.fontshare.com' },
			// https://fonts.google.com/specimen/Inter
			// https://fonts.google.com/specimen/Caveat
			{
				rel: 'stylesheet',
				href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Caveat:wght@400..700&display=swap'
			},
			// https://www.fontshare.com/fonts/erode
			{
				rel: 'stylesheet',
				href: 'https://api.fontshare.com/v2/css?f[]=erode@1,2&display=swap'
			},
			{ rel: 'stylesheet', href: styles }
		]
	}),
	shellComponent: RootDocument
});

function RootDocument(props: { children: React.ReactNode }) {
	const { children } = props;

	return (
		<html data-theme="light">
			<head>
				<HeadContent />
			</head>
			<body className="font-sans">
				{children}
				<TanStackRouterDevtools position="bottom-right" />
				<Scripts />
			</body>
		</html>
	);
}
