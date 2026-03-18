import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Analytics } from '@vercel/analytics/react';
import React from 'react';
import { CanvasBackground, CanvasFrame } from '@/components';
import styles from '../styles.css?url';

export const Route = createRootRoute({
	notFoundComponent: NotFoundPage,
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ name: 'robots', content: 'index, follow' },
			{ title: 'builder.group' },
			{
				name: 'description',
				content:
					'An indie software studio shipping SaaS products and open-source TypeScript libraries in public.'
			},
			{ property: 'og:type', content: 'website' },
			{ property: 'og:site_name', content: 'builder.group' },
			{ property: 'og:title', content: 'builder.group' },
			{
				property: 'og:description',
				content:
					'An indie software studio shipping SaaS products and open-source TypeScript libraries in public.'
			},
			{ property: 'og:url', content: 'https://builder.group' },
			{ property: 'og:image', content: 'https://builder.group/og.png' },
			{ property: 'og:image:width', content: '1200' },
			{ property: 'og:image:height', content: '630' },
			{ name: 'twitter:card', content: 'summary_large_image' },
			{ name: 'twitter:site', content: '@bennobuilder' },
			{ name: 'twitter:title', content: 'builder.group' },
			{
				name: 'twitter:description',
				content:
					'An indie software studio shipping SaaS products and open-source TypeScript libraries in public.'
			},
			{ name: 'twitter:image', content: 'https://builder.group/og.png' }
		],
		links: [
			{ rel: 'canonical', href: 'https://builder.group' },
			{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
			{ rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
			// https://fonts.google.com/specimen/Inter
			// https://fonts.google.com/specimen/Old+Standard+TT
			{
				rel: 'stylesheet',
				href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&display=swap'
			},
			{ rel: 'stylesheet', href: styles }
		],
		scripts: [
			// Apply theme before paint to prevent flash
			{
				children: `(function(){var t='auto';try{t=localStorage.getItem('blg-theme')||'auto';}catch(e){}var d=t==='dark'||(t==='auto'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);})();`
			},
			{
				type: 'application/ld+json',
				children: JSON.stringify({
					'@context': 'https://schema.org',
					'@type': 'Organization',
					'name': 'builder.group',
					'url': 'https://builder.group',
					'sameAs': ['https://github.com/builder-group', 'https://x.com/bennobuilder']
				})
			}
		]
	}),
	shellComponent: RootDocument
});

function RootDocument(props: { children: React.ReactNode }) {
	const { children } = props;

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body className="bg-base-0 text-base-950 font-sans">
				{children}
				<TanStackRouterDevtools position="bottom-right" />
				<Scripts />
				<Analytics />
			</body>
		</html>
	);
}

function NotFoundPage() {
	return (
		<CanvasBackground className="flex min-h-screen items-center justify-center">
			<CanvasFrame label="404">
				<div className="bg-base-100 px-16 py-12 text-center">
					<p className="text-base-950 mb-1 font-serif text-4xl font-bold tracking-tight">
						Not Found
					</p>
					<p className="text-base-400 text-sm">This page does not exist.</p>
					<a
						href="/"
						className="text-base-500 hover:text-base-800 focus-visible:ring-base-500 mt-6 inline-block rounded-sm text-sm underline underline-offset-2 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
					>
						Go home
					</a>
				</div>
			</CanvasFrame>
		</CanvasBackground>
	);
}
