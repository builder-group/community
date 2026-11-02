import { type AnyRouteMatch } from '@tanstack/react-router';
import React from 'react';
import { appConfig } from '@/environment/configs/app.config';

export const AppPage: React.FC<TAppPageProps> = (props) => {
	const { app, title, description = app.description, footerLink, children } = props;

	return (
		<div className="flex min-h-svh flex-col px-6">
			<main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-10 py-12 text-center">
				<header className="flex flex-col items-center gap-6">
					<img
						src={app.iconSrc}
						alt=""
						width={96}
						height={96}
						className="ring-base-950/10 size-24 rounded-[22px] object-cover ring-1"
					/>
					<div className="flex flex-col items-center gap-2">
						<h1 className="text-3xl font-semibold tracking-tight">{title ?? app.name}</h1>
						<p className="text-base-600 max-w-xs text-base leading-relaxed">{description}</p>
					</div>
				</header>
				{children}
			</main>
			<footer className="pb-6">
				<nav
					aria-label={`${app.name} links`}
					className="text-base-500 flex flex-wrap items-center justify-center gap-x-3 text-sm"
				>
					<a
						href={app.legal.privacy}
						className="hover:text-base-800 rounded-sm py-2 underline underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
					>
						Privacy
					</a>
					<span aria-hidden="true">·</span>
					<a
						href={app.legal.terms}
						className="hover:text-base-800 rounded-sm py-2 underline underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
					>
						License
					</a>
					<span aria-hidden="true">·</span>
					<a
						href={footerLink.href}
						className="hover:text-base-800 rounded-sm py-2 underline underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
					>
						{footerLink.label}
					</a>
				</nav>
			</footer>
		</div>
	);
};

export interface TAppPageProps {
	app: TAppPageConfig;
	title?: string;
	description?: string;
	footerLink: { href: string; label: string };
	children: React.ReactNode;
}

export interface TAppPageConfig {
	name: string;
	description: string;
	iconSrc: string;
	website: string;
	legal: {
		privacy: string;
		terms: string;
	};
}

export function getAppPageHead(
	app: TAppPageConfig,
	page: 'landing' | 'support' = 'landing'
): { meta: NonNullable<AnyRouteMatch['meta']> } {
	const title = `${app.name}${page === 'support' ? ' support' : ''} | builder.group`;
	const description =
		page === 'support'
			? `Get help with ${app.name}, report a problem, or send feedback.`
			: app.description;
	const image = new URL(app.iconSrc, appConfig.website).href;
	const imageAlt = `${app.name} app icon`;

	return {
		meta: [
			{ title },
			{ name: 'description', content: description },
			{ property: 'og:title', content: title },
			{ property: 'og:description', content: description },
			{ property: 'og:image', content: image },
			{ property: 'og:image:alt', content: imageAlt },
			{ name: 'twitter:card', content: 'summary' },
			{ name: 'twitter:title', content: title },
			{ name: 'twitter:description', content: description },
			{ name: 'twitter:image', content: image },
			{ name: 'twitter:image:alt', content: imageAlt }
		]
	};
}
