import { appConfig } from './app.config';

const email = 'support@builder.group';

export const selfiemirrorConfig = {
	name: 'SelfieMirror',
	description: 'Turn your mirror selfies into a timelapse.',
	iconSrc: '/illustrations/logos/selfiemirror.png',
	website: `${appConfig.website}/apps/selfiemirror`,
	help: {
		email,
		mailto: (subject?: string) => {
			const fullSubject = subject ? `[SelfieMirror] ${subject}` : '[SelfieMirror] Support Request';
			return `mailto:${email}?subject=${encodeURIComponent(fullSubject)}`;
		},
		discord: 'https://discord.com/invite/w4xE3bSjhQ'
	},
	legal: {
		privacy: `${appConfig.website}/apps/selfiemirror/legal/privacy`,
		terms: `${appConfig.website}/apps/selfiemirror/legal/terms`
	},
	appstore: 'https://apps.apple.com/app/id6828735544'
};
