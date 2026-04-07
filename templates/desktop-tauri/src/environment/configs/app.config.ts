export const appConfig = {
	help: {
		discord: 'https://discord.com/invite/w4xE3bSjhQ',
		email: 'support@builder.group',
		githubIssues: 'https://github.com/builder-group/community/issues',
		mailto: (subject: string) =>
			`mailto:${appConfig.help.email}?subject=${encodeURIComponent(`[Community] ${subject}`)}`
	},
	distribution: {
		website: 'https://builder.group',
		github: 'https://github.com/builder-group/community'
	}
} as const;
