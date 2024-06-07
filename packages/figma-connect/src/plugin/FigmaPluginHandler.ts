import type {
	TFromAppMessageEvent,
	TFromPluginMessageEvent,
	TPluginCallbackRegistration
} from '../types';
import { PluginCallback } from './PluginCallback';

export class FigmaPluginHandler<
	GFromAppMessageEvent extends TFromAppMessageEvent = TFromAppMessageEvent,
	GFromPluginMessageEvent extends TFromPluginMessageEvent = TFromPluginMessageEvent
> {
	public readonly figma: typeof figma;

	constructor(
		figmaInstance: typeof figma,
		options: TFigmaPluginHandlerOptions<GFromAppMessageEvent> = {}
	) {
		const { events = [] } = options;
		this.figma = figmaInstance;
		this.register(events);
	}

	public register(
		registrations:
			| TPluginCallbackRegistration<GFromAppMessageEvent>
			| TPluginCallbackRegistration<GFromAppMessageEvent>[]
	): (() => void)[] {
		const pluginCallbacks = Array.isArray(registrations)
			? registrations.map((r) => new PluginCallback(r))
			: [new PluginCallback(registrations)];

		return this.registerCallbacks(pluginCallbacks);
	}

	public post<GKey extends GFromPluginMessageEvent['key']>(
		key: GKey,
		args: Extract<GFromPluginMessageEvent, { key: GKey }>['args']
	): void {
		this.figma.ui.postMessage({ key, args });
	}

	// =========================================================================
	// Helper
	// =========================================================================

	private registerCallbacks(
		pluginCallbacks: PluginCallback<GFromAppMessageEvent>[]
	): (() => void)[] {
		return pluginCallbacks.map((callback) => this.registerCallback(callback));
	}

	private registerCallback(pluginCallback: PluginCallback<GFromAppMessageEvent>): () => void {
		let type: string = pluginCallback.type;
		let typeCategory: string | null = null;
		const typeParts = type.split('.');
		if (typeParts.length === 2) {
			typeCategory = typeParts[0] as unknown as string;
			type = typeParts[1] as unknown as string;
		}

		// Determine the target based on the type category
		const target = typeCategory === 'app' ? this.figma.ui : this.figma;
		const eventMethod = pluginCallback.once ? 'once' : 'on';

		const eventListener = (...args: any[]) => {
			this.onEvent(pluginCallback, args).catch((error: unknown) => {
				console.error('An error occurred while handling plugin callback', error);
			});
		};

		// Register the event listener
		(target[eventMethod] as any)(type, eventListener);

		// Return a function to unregister the event listener
		return () => {
			(target.off as any)(type, eventListener);
		};
	}

	private async onEvent(
		pluginCallback: PluginCallback<GFromAppMessageEvent>,
		args: any[]
	): Promise<void> {
		if (pluginCallback.type === 'app.message') {
			const arg = args[0];
			// console.log(`"${pluginCallback.key}" === "${arg?.key}"`, {
			// 	args: arg?.args
			// });
			if (arg?.key === pluginCallback.key && typeof arg?.args === 'object') {
				await pluginCallback.callback(this, arg.args);
			}
		} else {
			await pluginCallback.callback(this, ...args);
		}
	}
}

export interface TFigmaPluginHandlerOptions<GAppMessageEvent extends TFromAppMessageEvent> {
	events?: TPluginCallbackRegistration<GAppMessageEvent>[];
}
