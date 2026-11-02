import React from 'react';

export const AppPage: React.FC<TAppPageProps> = (props) => {
	const { app, title, description, iconSrc, footerLink, children } = props;

	return (
		<div className="flex min-h-svh flex-col px-6">
			<main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-10 py-12 text-center">
				<header className="flex flex-col items-center gap-6">
					<img
						src={iconSrc}
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
	description: string;
	iconSrc: string;
	footerLink: { href: string; label: string };
	children: React.ReactNode;
}

export interface TAppPageConfig {
	name: string;
	website: string;
	legal: {
		privacy: string;
		terms: string;
	};
}
