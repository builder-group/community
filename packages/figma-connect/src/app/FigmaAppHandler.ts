import type { TAppCallbackRegistration, TAppMessageEvent, TPluginMessageEvent } from '../types';
import { AppCallback } from './AppCallback';

export class FigmaAppHandler<
	GPluginMessageEvent extends TPluginMessageEvent = TPluginMessageEvent,
	GAppMessageEvent extends TAppMessageEvent = TAppMessageEvent
> {
	private readonly parent: Window;

	constructor(parentInstance: Window, options: TFigmaAppHandlerOptions<GPluginMessageEvent> = {}) {
		const { events = [] } = options;
		this.parent = parentInstance;
		this.register(events);
	}

	public register(
		registrations:
			| TAppCallbackRegistration<GPluginMessageEvent>
			| TAppCallbackRegistration<GPluginMessageEvent>[]
	): (() => void)[] {
		const appCallbacks = Array.isArray(registrations)
			? registrations.map((r) => new AppCallback(r))
			: [new AppCallback(registrations)];

		return this.registerCallbacks(appCallbacks);
	}

	public post<GKey extends GAppMessageEvent['key']>(
		key: GKey,
		args: Extract<GAppMessageEvent, { key: GKey }>['args']
	): void {
		this.parent.postMessage({ pluginMessage: { key, args } }, '*');
	}

	// =========================================================================
	// Helper
	// =========================================================================

	private registerCallbacks(appCallbacks: AppCallback<GPluginMessageEvent>[]): (() => void)[] {
		return appCallbacks.map((callback) => this.registerCallback(callback));
	}

	private registerCallback(appCallback: AppCallback<GPluginMessageEvent>): () => void {
		let type: string = appCallback.type;
		const typeParts = type.split('.');
		if (typeParts.length === 2) {
			type = typeParts[1] as unknown as string;
		}

		const eventListener = (...args: any[]): void => {
			if (appCallback.shouldCall()) {
				this.onEvent(appCallback, args).catch((error) => {
					console.error('An error occurred while handling app callback', error);
				});
			} else {
				removeEventListener(type, eventListener);
			}
		};

		// Register the event listener
		// Note: Using global 'addEventListener' to avoid cross-origin frame access errors.
		// Attempting to call 'parent.x' results in a DOMException for cross-origin frame access.
		addEventListener(type, eventListener);

		// Return a function to unregister the event listener
		return () => {
			removeEventListener(type, eventListener);
		};
	}

	private async onEvent(appCallback: AppCallback<GPluginMessageEvent>, args: any[]): Promise<void> {
		if (appCallback.type === 'plugin.message') {
			const data = args[0]?.data;
			const pluginMessage = data?.pluginMessage;
			// console.log(`"${appCallback.key}" === "${pluginMessage?.key}"`, {
			// 	args: pluginMessage?.args
			// });
			if (
				pluginMessage != null &&
				pluginMessage?.key === appCallback.key &&
				typeof pluginMessage?.args === 'object'
			) {
				await appCallback.callback(this, {
					pluginId: data?.pluginId,
					...pluginMessage.args
				});
			}
		} else {
			await appCallback.callback(this, ...args);
		}
	}
}

export interface TFigmaAppHandlerOptions<GPluginMessageEvent extends TPluginMessageEvent> {
	events?: TAppCallbackRegistration<GPluginMessageEvent>[];
}
