const email = 'support@builder.group';

export const appConfig = {
	name: 'Web TanStack',
	website: 'https://builder.group',
	help: {
		email,
		mailto: (subject?: string) => {
			const fullSubject = subject ? `[Web TanStack] ${subject}` : '[Web TanStack] Support';
			return `mailto:${email}?subject=${encodeURIComponent(fullSubject)}`;
		},
		discord: 'https://discord.com/invite/w4xE3bSjhQ'
	},
	distribution: {
		github: 'https://github.com/builder-group/community'
	}
} as const;
