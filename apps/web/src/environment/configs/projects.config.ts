import { appConfig } from './app.config';

export const projectsConfig: {
	projects: TProject[];
} = {
	projects: [
		// MARK: - SaaS: Maintenance
		{
			id: 'kairos',
			name: 'Kairos',
			description: 'iOS timer app that picks a random finish within a set range',
			logo: { type: 'image', src: '/illustrations/logos/kairos.png' },
			startedAt: { year: 2026, month: 3 },
			status: 'maintenance',
			category: 'saas',
			tags: [
				{ type: 'lab' },
				{
					type: 'app-store',
					url: 'https://apps.apple.com/us/app/kairos-random-timer/id6759820843'
				},
				{ type: 'github', url: `${appConfig.social.github}/lab/tree/develop/apps/kairos` }
			]
		},
		{
			id: 'focuscat',
			name: 'FocusCat',
			description: 'macOS pomodoro timer with a cat companion and app blocking',
			logo: { type: 'image', src: '/illustrations/logos/focuscat.png' },
			startedAt: { year: 2026, month: 1 },
			status: 'maintenance',
			category: 'saas',
			tags: [
				{ type: 'website', url: 'https://www.focuscat.app/' },
				{
					type: 'app-store',
					url: 'https://apps.apple.com/us/app/focuscat-pomodoro-timer/id6759088013'
				},
				{
					type: 'github',
					url: `${appConfig.social.github}/isshin/tree/develop/apps/focuscat-desktop`
				}
			]
		},
		{
			id: 'derive',
			name: 'Derive',
			description: 'iPhone app: pick a color, find 9 things, fill a 3×3 photo grid',
			logo: { type: 'image', src: '/illustrations/logos/derive.png' },
			startedAt: { year: 2026, month: 1 },
			status: 'maintenance',
			category: 'saas',
			tags: [
				{ type: 'lab' },
				{
					type: 'app-store',
					url: 'https://apps.apple.com/us/app/d%C3%A9rive-color-hunt-photo-game/id6757438691'
				},
				{ type: 'github', url: `${appConfig.social.github}/lab/tree/develop/apps/derive` }
			]
		},
		{
			id: 'tapling',
			name: 'Tapling',
			description: 'iOS keyboard extension with a Bongo Cat tapping as you type',
			logo: { type: 'image', src: '/illustrations/logos/tapling.png' },
			startedAt: { year: 2025, month: 12 },
			status: 'maintenance',
			category: 'saas',
			tags: [
				{
					type: 'app-store',
					url: 'https://apps.apple.com/us/app/tapling-type-with-bongo-cat/id6756097345'
				},
				{ type: 'github', url: `${appConfig.social.github}/tapling` }
			]
		},
		{
			id: 'learnlinesfaster',
			name: 'LearnLinesFaster',
			description: 'Line-learning tool using the first-letter method',
			logo: { type: 'emoji', value: '✨' },
			startedAt: { year: 2025, month: 10 },
			status: 'maintenance',
			category: 'saas',
			tags: [
				{ type: 'lab' },
				{ type: 'website', url: 'https://www.learnlinesfaster.com/' },
				{ type: 'github', url: `${appConfig.social.github}/lab/tree/develop/apps/learnlinesfaster` }
			]
		},
		{
			id: 'saku',
			name: 'Saku',
			description: 'Free Shopify link-in-bio page hosted on your store domain',
			logo: { type: 'image', src: '/illustrations/logos/saku.png' },
			startedAt: { year: 2025, month: 6 },
			status: 'maintenance',
			category: 'saas',
			tags: [
				{ type: 'shopify-store', url: 'https://apps.shopify.com/saku-bio-link' },
				{ type: 'github', url: `${appConfig.social.github}/saku` }
			]
		},
		{
			id: 'nodox',
			name: 'NoDox',
			description: 'Chrome extension that blurs sensitive data on webpages',
			logo: { type: 'image', src: '/illustrations/logos/nodox.png' },
			startedAt: { year: 2024, month: 9 },
			status: 'maintenance',
			category: 'saas',
			tags: [
				{
					type: 'chrome-store',
					url: 'https://chromewebstore.google.com/detail/nodox/lkfejllnajacchdacdmjbkdifeehkkia'
				},
				{ type: 'github', url: `${appConfig.social.github}/nodox` }
			]
		},
		// MARK: - SaaS: Paused
		{
			id: 'isshin',
			name: 'Isshin',
			description: 'macOS app that auto-adapts app blockers to your daily task plan',
			logo: { type: 'image', src: '/illustrations/logos/isshin.png' },
			startedAt: { year: 2025, month: 11 },
			status: 'paused',
			category: 'saas',
			tags: [
				{ type: 'website', url: 'https://isshin.app/' },
				{ type: 'github', url: `${appConfig.social.github}/isshin` }
			]
		},
		// MARK: - SaaS: Completed
		{
			id: 'gazegames',
			name: 'GazeGames',
			description: 'Generates image sets where person gazes at a moving target',
			logo: { type: 'emoji', value: '👀' },
			startedAt: { year: 2025, month: 11 },
			endedAt: { year: 2025, month: 11 },
			status: 'completed',
			category: 'saas',
			tags: [
				{ type: 'lab' },
				{ type: 'website', url: 'https://gazegames.vercel.app/' },
				{
					type: 'github',
					url: `${appConfig.social.github}/lab/tree/develop/apps/_deprecated/gazegames`
				}
			]
		},
		// MARK: - SaaS: Pivoted
		{
			id: 'saku-v1',
			name: 'Saku v1',
			description: 'Open-source page builder for creators on Bluesky / AT Protocol',
			logo: { type: 'image', src: '/illustrations/logos/saku-v1.png' },
			startedAt: { year: 2025, month: 1 },
			endedAt: { year: 2025, month: 6 },
			status: 'pivoted',
			category: 'saas',
			tags: [
				{ type: 'website', url: 'https://saku.so/' },
				{ type: 'github', url: `${appConfig.social.github}/saku-v1` }
			]
		},
		{
			id: 'sub-me',
			name: 'Sub.Me',
			description: 'Community and payment platform for creators',
			logo: { type: 'image', src: '/illustrations/logos/sub-me.png' },
			startedAt: { year: 2024, month: 11 },
			endedAt: { year: 2024, month: 12 },
			status: 'pivoted',
			category: 'saas',
			tags: [{ type: 'github', url: `${appConfig.social.github}/sub-me` }]
		},
		// MARK: - SaaS: Discontinued
		{
			id: 'tasu',
			name: 'Tasu',
			description: 'Open-source, video-first customer support tool',
			logo: { type: 'image', src: '/illustrations/logos/tasu.png' },
			startedAt: { year: 2025, month: 8 },
			endedAt: { year: 2025, month: 10 },
			status: 'discontinued',
			category: 'saas',
			tags: []
		},
		{
			id: 'actorpal',
			name: 'ActorPal',
			description: 'Tools for actor line learning, scene practice, and auditions',
			logo: { type: 'emoji', value: '✨' },
			startedAt: { year: 2025, month: 10 },
			endedAt: { year: 2025, month: 10 },
			status: 'discontinued',
			category: 'saas',
			tags: []
		},
		{
			id: 'chatsnap',
			name: 'ChatSnap',
			description: 'Automated channel generating chat-conversation videos',
			logo: { type: 'image', src: '/illustrations/logos/chatsnap.png' },
			startedAt: { year: 2024, month: 9 },
			endedAt: { year: 2024, month: 12 },
			status: 'discontinued',
			category: 'saas',
			tags: [
				{ type: 'youtube', url: 'https://www.youtube.com/@chatdotsnap' },
				{ type: 'github', url: `${appConfig.social.github}/shortify` }
			]
		},
		{
			id: 'midimarble',
			name: 'MidiMarble',
			description: 'Automated channel generating marble music videos',
			logo: { type: 'image', src: '/illustrations/logos/midimarble.png' },
			startedAt: { year: 2024, month: 9 },
			endedAt: { year: 2024, month: 12 },
			status: 'discontinued',
			category: 'saas',
			tags: [
				{ type: 'youtube', url: 'https://www.youtube.com/@midimarble' },
				{ type: 'github', url: `${appConfig.social.github}/shortify` }
			]
		},
		{
			id: 'eu-blocks',
			name: 'EU Blocks',
			description: 'Shopify app with GDPR and EU energy label compliant UI blocks',
			logo: { type: 'image', src: '/illustrations/logos/eu-blocks.png' },
			startedAt: { year: 2024, month: 7 },
			endedAt: { year: 2024, month: 9 },
			status: 'discontinued',
			category: 'saas',
			tags: [{ type: 'github', url: `${appConfig.social.github}/shopify` }]
		},
		{
			id: 'shortify',
			name: 'Shortify',
			description: 'AI tool to automate short-form video content creation',
			logo: { type: 'image', src: '/illustrations/logos/shortify.png' },
			startedAt: { year: 2024, month: 9 },
			endedAt: { year: 2024, month: 12 },
			status: 'discontinued',
			category: 'saas',
			tags: [{ type: 'github', url: `${appConfig.social.github}/shortify` }]
		},
		{
			id: 'open-box',
			name: 'Open Box',
			description: 'Shopify app for deferred shipping and bulk order bundling',
			logo: { type: 'emoji', value: '📦' },
			startedAt: { year: 2024, month: 10 },
			endedAt: { year: 2024, month: 11 },
			status: 'discontinued',
			category: 'saas',
			tags: [{ type: 'github', url: `${appConfig.social.github}/shopify` }]
		},
		// MARK: - Packages
		{
			id: 'ecsify',
			name: 'ecsify',
			description: 'Typesafe Entity Component System (ECS) library for TypeScript',
			startedAt: { year: 2024 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/ecsify' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/ecsify` }
			]
		},
		{
			id: 'feature-fetch',
			name: 'feature-fetch',
			description: 'Typesafe fetch wrapper with OpenAPI type support',
			startedAt: { year: 2024 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/feature-fetch' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/feature-fetch` }
			]
		},
		{
			id: 'feature-form',
			name: 'feature-form',
			description: 'Straightforward, typesafe, and feature-based form library',
			startedAt: { year: 2024 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/feature-form' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/feature-form` }
			]
		},
		{
			id: 'feature-logger',
			name: 'feature-logger',
			description: 'Straightforward, typesafe, and feature-based logging library',
			startedAt: { year: 2024 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/feature-logger' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/feature-logger` }
			]
		},
		{
			id: 'feature-react',
			name: 'feature-react',
			description: 'React hooks and components for feature-state and feature-form',
			startedAt: { year: 2024 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/feature-react' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/feature-react` }
			]
		},
		{
			id: 'feature-state',
			name: 'feature-state',
			description: 'Typesafe, feature-based state management library for React',
			startedAt: { year: 2024 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/feature-state' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/feature-state` }
			]
		},
		{
			id: 'openapi-ts-router',
			name: 'openapi-ts-router',
			description: 'Typesafe OpenAPI router wrapper for Express and Hono',
			startedAt: { year: 2024 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/openapi-ts-router' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/openapi-ts-router` }
			]
		},
		{
			id: 'xml-tokenizer',
			name: 'xml-tokenizer',
			description: 'Typesafe XML tokenizer with callback-based token streaming',
			startedAt: { year: 2024 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/xml-tokenizer' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/xml-tokenizer` }
			]
		},
		{
			id: 'tuple-result',
			name: 'tuple-result',
			description: 'Minimal, tree-shakable Result type library for TypeScript',
			startedAt: { year: 2024 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/tuple-result' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/tuple-result` }
			]
		},
		{
			id: 'validatenv',
			name: 'validatenv',
			description: 'Typesafe env variable validation with Zod, Valibot, and Yup',
			startedAt: { year: 2024 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/validatenv' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/validatenv` }
			]
		},
		{
			id: 'validation-adapter',
			name: 'validation-adapter',
			description: 'Universal adapter interface for Zod, Valibot, and Yup',
			startedAt: { year: 2024 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/validation-adapter' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/validation-adapter` }
			]
		},
		{
			id: 'validation-adapters',
			name: 'validation-adapters',
			description: 'Pre-built adapters for validation-adapter: Zod and Valibot',
			startedAt: { year: 2024 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/validation-adapters' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/validation-adapters` }
			]
		},
		{
			id: 'head-metadata',
			name: 'head-metadata',
			description: 'Typesafe utility to extract metadata from an HTML <head>',
			startedAt: { year: 2024 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/head-metadata' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/head-metadata` }
			]
		},
		{
			id: 'utils',
			name: '@blgc/utils',
			description: 'Typesafe, tree-shakable collection of utility functions',
			startedAt: { year: 2024 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/@blgc/utils' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/utils` }
			]
		},
		{
			id: 'types',
			name: '@blgc/types',
			description: 'Shared TypeScript types across builder.group packages',
			startedAt: { year: 2024 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/@blgc/types' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/types` }
			]
		},
		{
			id: 'eprel-client',
			name: 'eprel-client',
			description: 'Typesafe fetch client for the EU EPREL energy label API',
			startedAt: { year: 2024 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/eprel-client' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/eprel-client` }
			]
		},
		{
			id: 'config',
			name: '@blgc/config',
			description: 'Collection of ESLint, Vite, and TypeScript configurations',
			startedAt: { year: 2024 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/@blgc/config' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/config` }
			]
		},
		{
			id: 'rollup-presets',
			name: 'rollup-presets',
			description: 'Opinionated, production-ready Rollup configuration presets',
			startedAt: { year: 2024 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/rollup-presets' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/rollup-presets` }
			]
		},
		{
			id: 'split-flap-board',
			name: 'split-flap-board',
			description:
				'Web component that simulates a split-flap display inspired by airport and train station boards',
			startedAt: { year: 2026 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/split-flap-board' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/split-flap-board` }
			]
		}
	]
};

export interface TProject {
	id: string;
	name: string;
	description: string;
	logo?: TProjectLogo;
	startedAt: TProjectDate;
	endedAt?: TProjectDate;
	status: TProjectStatus;
	category: TProjectCategory;
	tags: TProjectTag[];
}

export type TProjectDate = { year: number; month?: number };

export type TProjectCategory = 'saas' | 'package';

export type TProjectStatus =
	| 'in-progress'
	| 'maintenance'
	| 'discontinued'
	| 'paused'
	| 'pivoted'
	| 'completed';

export type TProjectLogo = { type: 'image'; src: string } | { type: 'emoji'; value: string };

export type TProjectTag =
	| { type: 'github'; url: string }
	| { type: 'website'; url: string }
	| { type: 'app-store'; url: string }
	| { type: 'chrome-store'; url: string }
	| { type: 'shopify-store'; url: string }
	| { type: 'npm'; url: string }
	| { type: 'product-hunt'; url: string }
	| { type: 'youtube'; url: string }
	| { type: 'lab' };
