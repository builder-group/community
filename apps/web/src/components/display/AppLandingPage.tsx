import React from 'react';

export const AppLandingPage: React.FC<TAppLandingPageProps> = (props) => {
	const { app, description, iconSrc } = props;

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
						<h1 className="text-3xl font-semibold tracking-tight">{app.name}</h1>
						<p className="text-base-600 max-w-xs text-base leading-relaxed">{description}</p>
					</div>
				</header>
				<a
					href={app.appstore}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4"
				>
					<img
						src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83&releaseDate=1704067200"
						alt="Download on the App Store"
						width={250}
						height={83}
						className="h-14 w-auto"
					/>
				</a>
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
						href={`${app.website}/help/`}
						className="hover:text-base-800 rounded-sm py-2 underline underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
					>
						Support
					</a>
				</nav>
			</footer>
		</div>
	);
};

export interface TAppLandingPageProps {
	app: {
		name: string;
		appstore: string;
		website: string;
		legal: {
			privacy: string;
			terms: string;
		};
	};
	description: string;
	iconSrc: string;
}
