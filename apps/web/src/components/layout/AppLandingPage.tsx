import React from 'react';
import { AppPage, type TAppPageConfig } from './AppPage';

export const AppLandingPage: React.FC<TAppLandingPageProps> = (props) => {
	const { app } = props;

	return (
		<AppPage app={app} footerLink={{ href: `${app.website}/help/`, label: 'Support' }}>
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
		</AppPage>
	);
};

export interface TAppLandingPageProps {
	app: TAppPageConfig & { appstore: string };
}
