const email = 'support@builder.group';

export const appConfig = {
	name: 'Builder.Group',
	website: 'https://builder.group',
	help: {
		email,
		mailto: (subject?: string) => {
			const fullSubject = subject ? `[Builder.Group] ${subject}` : '[Builder.Group] Support Request';
			return `mailto:${email}?subject=${encodeURIComponent(fullSubject)}`;
		},
		discord: 'https://discord.com/invite/w4xE3bSjhQ'
	},
	social: {
		github: 'https://github.com/builder-group'
	}
};
