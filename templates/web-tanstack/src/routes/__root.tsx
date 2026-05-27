import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import React from 'react';
import { appConfig } from '@/environment';
import styles from '../styles.css?url';

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ title: appConfig.name }
		],
		links: [
			{
				rel: 'stylesheet',
				href: styles
			}
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
			<body className="font-sans text-black antialiased">
				{children}
				{import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
				<Scripts />
			</body>
		</html>
	);
}
