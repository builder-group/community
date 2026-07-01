import { appConfig } from './app.config';

const email = 'support@builder.group';

export const taplingConfig = {
	name: 'Tapling',
	website: `${appConfig.website}/apps/tapling`,
	help: {
		email,
		mailto: (subject?: string) => {
			const fullSubject = subject ? `[Tapling] ${subject}` : '[Tapling] Support Request';
			return `mailto:${email}?subject=${encodeURIComponent(fullSubject)}`;
		},
		discord: 'https://discord.com/invite/w4xE3bSjhQ'
	},
	legal: {
		privacy: `${appConfig.website}/apps/tapling/legal/privacy`,
		terms: `${appConfig.website}/apps/tapling/legal/terms`
	},
	appstore: 'https://apps.apple.com/us/app/tapling-type-with-bongo-cat/id6756097345'
};
