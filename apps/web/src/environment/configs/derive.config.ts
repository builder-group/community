import { appConfig } from './app.config';

const email = 'support@builder.group';

export const deriveConfig = {
	name: 'Dérive',
	website: `${appConfig.website}/apps/derive`,
	help: {
		email,
		mailto: (subject?: string) => {
			const fullSubject = subject ? `[Dérive] ${subject}` : '[Dérive] Support Request';
			return `mailto:${email}?subject=${encodeURIComponent(fullSubject)}`;
		},
		discord: 'https://discord.com/invite/w4xE3bSjhQ'
	},
	legal: {
		privacy: `${appConfig.website}/apps/derive/legal/privacy`,
		terms: `${appConfig.website}/apps/derive/legal/terms`
	},
	appstore: ''
};
