import { describe, it } from 'vitest';
import { createApp } from '../create-app';
import { createDefaultPlugin, TDefaultPlugin } from '../plugins';
import { TPlugin } from './plugin';

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
				setup: (app) => {}
			};
		}

		const app = createApp({
			plugins: [createDefaultPlugin(), createGamePlugin()] as const,
			systemSets: ['First', 'Update', 'Last']
		});

		app.update();
	});
});

type TGamePlugin = TPlugin<
	{
		name: 'Game';
		components: {
			Position: TCPosition;
			Velocity: TCVelocity;
			Rectangle: TCRectangle;
			Color: TCColor;
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
		setup: (app) => {}
	};
}

const app = createApp({
	plugins: [createDefaultPlugin(), createGamePlugin()] as const,
	systemSets: ['First', 'Update', 'Last']
});

app.update();
