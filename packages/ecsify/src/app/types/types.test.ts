import { describe, it } from 'vitest';
import { createApp } from '../create-app';
import { createDefaultPlugin, TDefaultPlugin } from '../plugins';
import { TInnerAppContext } from './app';
import { TMergePlugins, TPlugin } from './plugin';

describe('types', () => {
	it('should work', () => {
		// Define plugin
		type TGamePlugin = TPlugin<
			{
				name: 'Game';
				components: {
					Position: TCPosition;
					Velocity: TCVelocity;
					Rectangle: TCRectangle;
					Color: TCColor;
				};
				resources: {
					game: {
						score: number;
					};
				};
			},
			[TDefaultPlugin]
		>;

		// Define components
		type TCPosition = { x: number[]; y: number[] };
		type TCVelocity = { dx: number[]; dy: number[] };
		type TCRectangle = { width: number[]; height: number[] };
		type TCColor = { value: string[] };

		function createGamePlugin(): TGamePlugin {
			return {
				name: 'Game',
				deps: ['Default'],
				components: {
					Position: { x: [], y: [] },
					Velocity: { dx: [], dy: [] },
					Rectangle: { width: [], height: [] },
					Color: { value: [] }
				},
				resources: {
					game: {
						score: 0
					}
				},
				setup: (app) => {}
			};
		}

		const app = createApp({
			plugins: [createDefaultPlugin(), createGamePlugin()] as const,
			systemSets: ['First', 'Update', 'Last', 'Flush']
		});

		app.r.game;
		app.c.Position;

		type TGameMergedPlugins = TMergePlugins<[TGamePlugin, TDefaultPlugin]>;
		type TGameInnerAppContext = TInnerAppContext<TGameMergedPlugins>;
		type TGameMergedPluginsSystemSets = TGameMergedPlugins['systemSets'];
		type TGameInnerAppContextSystemSets = TGameInnerAppContext['systemSets'];

		app.update();
	});
});
