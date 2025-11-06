import { describe, it } from 'vitest';
import { FigmaAppHandler, type TAppCallbackRegistration, type TFromAppMessageEvent } from './app';
import {
	FigmaPluginHandler,
	type TFromPluginMessageEvent,
	type TPluginCallbackRegistration
} from './plugin';

describe('figma-connect test', () => {
	it('should work', () => {
		// shared.ts

		// Plugin Events (Plugin -> App)
		interface TOnSelectNodeEvent extends TFromPluginMessageEvent {
			key: 'on-select-node';
			args: { selected: Pick<SceneNode, 'name' | 'id'>[] };
		}

		interface TOnDeselectNodeEvent extends TFromPluginMessageEvent {
			key: 'on-deselect-node';
			args: { deselected: Pick<SceneNode, 'name' | 'id'>[] };
		}

		type TFromPluginMessageEvents = TOnSelectNodeEvent | TOnDeselectNodeEvent;

		// App Events (App -> Plugin)
		interface TOnUIRouteChangeEvent extends TFromAppMessageEvent {
			key: 'on-ui-route-change';
			args: {
				activeRoute: 'a' | 'b' | 'c';
			};
		}

		interface TOnUserLoginEvent extends TFromAppMessageEvent {
			key: 'on-user-login';
			args: {
				userId: string;
				timestamp: number;
			};
		}

		type TFromAppMessageEvents = TOnUIRouteChangeEvent | TOnUserLoginEvent;

		// For App part
		type TCustomAppCallbackRegistration = TAppCallbackRegistration<TFromPluginMessageEvents>;

		// For Plugin part
		type TCustomPluginCallbackRegistration = TPluginCallbackRegistration<TFromAppMessageEvents>;

		// app.ts

		const appHandler = new FigmaAppHandler<TFromPluginMessageEvents, TFromAppMessageEvents>(parent);

		appHandler.post('on-ui-route-change', { activeRoute: 'a' });
		appHandler.post('on-user-login', { userId: 'user123', timestamp: Date.now() });

		appHandler.register({
			key: 'on-select-node',
			type: 'plugin.message',
			callback: async (_, args) => {
				console.log('Selected Nodes:', args.selected);
			}
		});

		appHandler.register({
			key: 'on-deselect-node',
			type: 'plugin.message',
			callback: async (_, args) => {
				console.log('Deselected Nodes:', args.deselected);
			}
		});

		// plugin.ts

		const pluginHandler = new FigmaPluginHandler<TFromAppMessageEvents, TFromPluginMessageEvents>(
			figma
		);

		pluginHandler.post('on-select-node', { selected: [{ id: '1v1', name: 'Frame1' }] });
		pluginHandler.post('on-deselect-node', { deselected: [{ id: '1v1', name: 'Frame1' }] });

		pluginHandler.register({
			key: 'on-ui-route-change',
			type: 'app.message',
			callback: async (_, args) => {
				console.log('UI Route Changed:', args.activeRoute);
			}
		});

		pluginHandler.register({
			key: 'on-user-login',
			type: 'app.message',
			callback: async (_, args) => {
				console.log('User Logged In:', args.userId, 'at', args.timestamp);
			}
		});
	});
});
