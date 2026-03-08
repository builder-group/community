import { appConfig } from './app.config';

const email = 'support@builder.group';

export const kairosConfig = {
	name: 'Kairos',
	website: `${appConfig.website}/apps/kairos`,
	help: {
		email,
		mailto: (subject?: string) => {
			const fullSubject = subject ? `[Kairos] ${subject}` : '[Kairos] Support Request';
			return `mailto:${email}?subject=${encodeURIComponent(fullSubject)}`;
		},
		discord: 'https://discord.com/invite/w4xE3bSjhQ'
	},
	legal: {
		privacy: `${appConfig.website}/apps/kairos/legal/privacy`,
		terms: `${appConfig.website}/apps/kairos/legal/terms`
	},
	appstore: 'https://apps.apple.com/us/app/kairos-random-timer/id6743891997'
};
