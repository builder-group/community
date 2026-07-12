import { appConfig } from './app.config';

export const projectsConfig: {
	projects: TProject[];
} = {
	projects: [
		// MARK: - SaaS: In Progress
		{
			id: 'abstand',
			name: 'Abstand',
			description:
				'macOS app to schedule focus sessions with automatic app blocking and forced breaks',
			logo: { type: 'image', src: '/illustrations/logos/abstand.png' },
			startedAt: { year: 2026, month: 4 },
			status: 'maintenance',
			category: 'saas',
			tags: [
				{ type: 'website', url: 'https://abstand.app/' },
				{ type: 'github', url: 'https://github.com/builder-group/abstand' }
			]
		},
		// MARK: - SaaS: Maintenance
		{
			id: 'kairos',
			name: 'Kairos',
			description: 'iOS timer app that picks a random end time within a set range',
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
					url: `${appConfig.social.github}/focuscat`
				}
			]
		},
		{
			id: 'derive',
			name: 'Derive',
			description: 'iPhone app to pick a color, find 9 matching things, and fill a 3×3 photo grid',
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
			description: 'Web app for learning scripts using the first-letter mnemonic method',
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
			tags: [{ type: 'website', url: 'https://isshin.app/' }]
		},
		// MARK: - SaaS: Completed
		{
			id: 'gazegames',
			name: 'GazeGames',
			description:
				'Web tool that generates a set of images where eyes and objects gaze at a moving target',
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
			tags: []
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
			description: 'Suite of tools for actor line learning, scene practice, and mock auditions',
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
			description: 'Automated YouTube channel posting AI-generated chat conversation videos',
			logo: { type: 'image', src: '/illustrations/logos/chatsnap.png' },
			startedAt: { year: 2024, month: 9 },
			endedAt: { year: 2024, month: 12 },
			status: 'discontinued',
			category: 'saas',
			tags: [{ type: 'youtube', url: 'https://www.youtube.com/@chatdotsnap' }]
		},
		{
			id: 'midimarble',
			name: 'MidiMarble',
			description: 'Automated YouTube channel posting AI-generated marble music videos',
			logo: { type: 'image', src: '/illustrations/logos/midimarble.png' },
			startedAt: { year: 2024, month: 9 },
			endedAt: { year: 2024, month: 12 },
			status: 'discontinued',
			category: 'saas',
			tags: [{ type: 'youtube', url: 'https://www.youtube.com/@midimarble' }]
		},
		{
			id: 'eu-blocks',
			name: 'EU Blocks',
			description: 'Shopify app with pre-built GDPR and EU energy label compliant UI blocks',
			logo: { type: 'image', src: '/illustrations/logos/eu-blocks.png' },
			startedAt: { year: 2024, month: 7 },
			endedAt: { year: 2024, month: 9 },
			status: 'discontinued',
			category: 'saas',
			tags: []
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
			tags: []
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
			tags: []
		},
		// MARK: - Packages
		{
			id: 'ecsify',
			name: 'ecsify',
			description:
				'TypeScript ECS with typed plugins, flexible component storage, queries, and tracking',
			startedAt: { year: 2024 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/ecsify' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/ecsify` }
			]
		},
		{
			id: 'feature-core',
			name: 'feature-core',
			description:
				'Typed .with() feature composition with dependency checks for TypeScript objects',
			startedAt: { year: 2026 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/feature-core' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/feature-core` }
			]
		},
		{
			id: 'feature-fetch',
			name: 'feature-fetch',
			description:
				'Typed fetch client with tuple results and opt-in REST, OpenAPI, GraphQL, retry, cache',
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
			description:
				'Framework-agnostic reactive form state with Standard Schema validation and triggers',
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
			description:
				'Composable console logger with levels, formatting, middleware, and testable output',
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
			description: 'Provider-free React hooks for feature-state and feature-form subscriptions',
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
			description:
				'Reactive state with computed values and opt-in undo, storage, equality, and queues',
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
			description:
				'Typed Express and Hono routes backed by OpenAPI paths and Standard Schema validation',
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
			description:
				'Streaming XML, HTML, and SVG tokenizer with typed tokens, selectors, object helpers',
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
			description:
				'Plain TypeScript Result tuples with typed errors, narrowing, helpers, JSON-friendly arrays',
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
			description:
				'Typed env validation with Standard Schema validators, built-in parsers, error reports',
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
			description: 'Universal validation abstraction for Zod, Valibot, and Yup',
			startedAt: { year: 2024 },
			endedAt: { year: 2026, month: 5 },
			status: 'discontinued',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/validation-adapter' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/_deprecated/validation-adapter` }
			]
		},
		{
			id: 'validation-adapters',
			name: 'validation-adapters',
			description: 'Validator adapter implementations for Zod, Valibot, Yup, and Standard Schema',
			startedAt: { year: 2024 },
			endedAt: { year: 2026, month: 5 },
			status: 'discontinued',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/validation-adapters' },
				{
					type: 'github',
					url: `${appConfig.social.githubPackages}/_deprecated/validation-adapters`
				}
			]
		},
		{
			id: 'head-metadata',
			name: 'head-metadata',
			description:
				'Typed HTML head metadata extraction for title, meta, link, and custom extractors',
			startedAt: { year: 2024 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/head-metadata' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/head-metadata` }
			]
		},
		{
			id: 'mado',
			name: 'mado',
			description: 'macOS active app and window monitoring with browser metadata',
			startedAt: { year: 2026, month: 1 },
			status: 'maintenance',
			category: 'package',
			tags: [
				{ type: 'crate', url: 'https://crates.io/crates/mado' },
				{
					type: 'github',
					url: `${appConfig.social.github}/community/tree/develop/crates/mado`
				}
			]
		},
		{
			id: 'utils',
			name: '@blgc/utils',
			description: 'TypeScript utilities for colors, IDs, objects, URLs, and math',
			startedAt: { year: 2024 },
			endedAt: { year: 2026, month: 5 },
			status: 'discontinued',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/@blgc/utils' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/_deprecated/utils` }
			]
		},
		{
			id: 'types',
			name: '@blgc/types',
			description: 'Shared utility, API, and OpenAPI TypeScript types',
			startedAt: { year: 2024 },
			endedAt: { year: 2026, month: 5 },
			status: 'discontinued',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/@blgc/types' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/_deprecated/types` }
			]
		},
		{
			id: 'eprel-client',
			name: 'eprel-client',
			description: 'EU EPREL energy label registry API client',
			startedAt: { year: 2024 },
			endedAt: { year: 2026, month: 5 },
			status: 'discontinued',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/eprel-client' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/_deprecated/eprel-client` }
			]
		},
		{
			id: 'config',
			name: '@blgc/config',
			description:
				'Shared TypeScript, ESLint, Prettier, and Vitest configs for Builder Group projects',
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
			description:
				'Rollup presets for TypeScript libraries with package export discovery and declarations',
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
			description: 'Web Components for animated split-flap boards',
			startedAt: { year: 2026 },
			endedAt: { year: 2026, month: 5 },
			status: 'discontinued',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/split-flap-board' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/_deprecated/split-flap-board` }
			]
		},
		{
			id: 'figma-connect',
			name: 'figma-connect',
			description: 'Typed message bridge between Figma plugin UI iframes and sandbox code',
			startedAt: { year: 2024 },
			endedAt: { year: 2025, month: 11 },
			status: 'discontinued',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/figma-connect' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/_deprecated/figma-connect` }
			]
		},
		{
			id: 'google-webfonts-client',
			name: 'google-webfonts-client',
			description: 'Google Web Fonts metadata and font download client',
			startedAt: { year: 2024 },
			endedAt: { year: 2025, month: 11 },
			status: 'discontinued',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/google-webfonts-client' },
				{
					type: 'github',
					url: `${appConfig.social.githubPackages}/_deprecated/google-webfonts-client`
				}
			]
		},
		{
			id: 'elevenlabs-client',
			name: 'elevenlabs-client',
			description: 'ElevenLabs text-to-speech API client',
			startedAt: { year: 2024 },
			endedAt: { year: 2025, month: 11 },
			status: 'discontinued',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/elevenlabs-client' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/_deprecated/elevenlabs-client` }
			]
		},
		{
			id: 'kleinanzeigen-client',
			name: 'kleinanzeigen-client',
			description: 'Kleinanzeigen scraping and listing extraction client',
			startedAt: { year: 2025 },
			endedAt: { year: 2025, month: 11 },
			status: 'discontinued',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/kleinanzeigen-client' },
				{
					type: 'github',
					url: `${appConfig.social.githubPackages}/_deprecated/kleinanzeigen-client`
				}
			]
		},
		{
			id: 'cli',
			name: '@blgc/cli',
			description: 'Rollup and esbuild CLI for bundling TypeScript libraries',
			startedAt: { year: 2024 },
			endedAt: { year: 2026, month: 3 },
			status: 'discontinued',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/@blgc/cli' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/_deprecated/cli` }
			]
		},
		{
			id: 'widget-grid',
			name: 'widget-grid',
			description: 'Framework-agnostic widget grid model with cell-based layouts and widget data',
			startedAt: { year: 2024 },
			status: 'discontinued',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/widget-grid' },
				{
					type: 'github',
					url: 'https://github.com/builder-group/saku-v1/tree/develop/apps/web/src/features/editor'
				}
			]
		},
		{
			id: 'openapi-express',
			name: 'openapi-express',
			description: 'OpenAPI-typed Express router wrapper with Zod request validation',
			startedAt: { year: 2024 },
			endedAt: { year: 2025, month: 1 },
			status: 'discontinued',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/openapi-express' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/_deprecated/openapi-express` }
			]
		},
		{
			id: 'webito',
			name: 'webito',
			description: 'ECS-powered visual web editor with plugin-based customization',
			startedAt: { year: 2024 },
			endedAt: { year: 2026, month: 5 },
			status: 'discontinued',
			category: 'package',
			tags: [
				{ type: 'npm', url: 'https://www.npmjs.com/package/webito' },
				{ type: 'github', url: `${appConfig.social.githubPackages}/_deprecated/webito` }
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
	'in-progress' | 'maintenance' | 'discontinued' | 'paused' | 'pivoted' | 'completed';

export type TProjectLogo = { type: 'image'; src: string } | { type: 'emoji'; value: string };

export type TProjectTag =
	| { type: 'github'; url: string }
	| { type: 'website'; url: string }
	| { type: 'app-store'; url: string }
	| { type: 'chrome-store'; url: string }
	| { type: 'shopify-store'; url: string }
	| { type: 'crate'; url: string }
	| { type: 'npm'; url: string }
	| { type: 'product-hunt'; url: string }
	| { type: 'youtube'; url: string }
	| { type: 'lab' };
