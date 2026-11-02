import React from 'react';
import { AppPage, type TAppPageConfig } from './AppPage';

export const AppSupportPage: React.FC<TAppSupportPageProps> = (props) => {
	const { app, iconSrc } = props;

	return (
		<AppPage
			app={app}
			title={`${app.name} support`}
			description="Questions, feedback, or a problem?"
			iconSrc={iconSrc}
			footerLink={{ href: app.website, label: 'App page' }}
		>
			<div className="flex flex-col items-center gap-2">
				<a
					href={app.help.mailto()}
					className="bg-base-950 text-base-0 hover:bg-base-800 focus-visible:outline-base-950 rounded-lg px-6 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
				>
					Email support
				</a>
				<a
					href={app.help.discord}
					target="_blank"
					rel="noopener noreferrer"
					className="text-base-500 hover:text-base-800 rounded-sm py-2 text-sm underline underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
				>
					Join our Discord
				</a>
			</div>
		</AppPage>
	);
};

export interface TAppSupportPageProps {
	app: TAppPageConfig & {
		help: {
			mailto: () => string;
			discord: string;
		};
	};
	iconSrc: string;
}
