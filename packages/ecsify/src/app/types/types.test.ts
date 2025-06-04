import { describe, it } from 'vitest';
import { TApp, TAppContext } from './app';
import { TPlugin } from './plugin';

describe('types', () => {
	it('should work', () => {
		type TTransformPlugin = TPlugin<{
			name: 'Transform';
			components: {
				Transform: { x: number; y: number; rotation: number };
				Velocity: { dx: number; dy: number };
			};
			appExtensions: {
				move: () => void;
			};
			systemSets: 'Movement' | 'Physics';
		}>;

		type TRenderPlugin = TPlugin<
			{
				name: 'Render';
				components: {
					Sprite: { texture: string; visible: boolean };
				};
				resources: {
					renderer: { canvas: any };
				};
				systemSets: 'Render';
			},
			[TTransformPlugin]
		>;

		type TGamePlugin = TPlugin<
			{
				name: 'Game';
				components: {
					Player: { id: string };
					Health: { value: number; max: number };
				};
				events: {
					PlayerDied: { playerId: string };
					LevelCompleted: { level: number };
				};
				systemSets: 'Game';
			},
			[TTransformPlugin, TRenderPlugin]
		>;

		const createTransformPlugin = (): TTransformPlugin => ({
			name: 'Transform',
			deps: [],
			components: {
				Transform: null as any,
				Velocity: null as any
			},
			appExtensions: {
				move: () => {
					console.log('move');
				}
			},
			setup: (app) => {
				app.c.Transform;
				app.c.Velocity;
			}
		});

		const createRenderPlugin = (): TRenderPlugin => ({
			name: 'Render',
			deps: ['Transform'],
			components: {
				Sprite: null as any
			},
			resources: {
				renderer: { canvas: null as any }
			},
			setup: (app) => {
				app.c.Transform; // From Transform dependency
				app.c.Sprite; // From Render plugin
				app.r.renderer; // From Render plugin
			}
		});

		const createGamePlugin = (): TGamePlugin => ({
			name: 'Game',
			deps: ['Transform', 'Render'],
			components: {
				Player: null as any,
				Health: null as any
			},
			setup: (app) => {
				app.c.Transform; // From Transform dependency
				app.c.Sprite; // From Render dependency
				app.c.Player; // From Game plugin
				app.r.renderer; // From Render dependency
			}
		});

		type TTestAppContext = TAppContext<[TTransformPlugin, TRenderPlugin, TGamePlugin]>;
		type TSystemSets = TTestAppContext['systemSets'];
		type TEvents = TTestAppContext['events'];

		const testApp: TApp<TTestAppContext> = null as any;
		testApp._eventRegistry.push('PlayerDied', { playerId: '1' });
	});
});
