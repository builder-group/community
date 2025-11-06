import type { FigmaAppHandler } from './app';
import type { FigmaPluginHandler } from './plugin';

// =============================================================================
// Plugin
// =============================================================================

export type TPluginCallbackRegistration<
	GFromAppMessageEvent extends TFromAppMessageEvent = TFromAppMessageEvent
> = GFromAppMessageEvent extends TFromAppMessageEvent
	? {
			[K in keyof TPluginEventTypes<TFromAppMessageEvent>]: TPluginCallbackRegistrationBase<
				GFromAppMessageEvent,
				K
			>;
		}[keyof TPluginEventTypes<GFromAppMessageEvent>]
	: never;

export interface TPluginCallbackRegistrationBase<
	GFromAppMessageEvent extends TFromAppMessageEvent,
	GEventType extends keyof TPluginEventTypes<GFromAppMessageEvent>,
	GPluginCallbackArgs extends
		TPluginEventTypes<GFromAppMessageEvent>[GEventType][0] = TPluginEventTypes<GFromAppMessageEvent>[GEventType][0],
	GPluginCallbackReturnValue extends
		TPluginEventTypes<GFromAppMessageEvent>[GEventType][1] = TPluginEventTypes<GFromAppMessageEvent>[GEventType][1],
	GPluginCallbackKey extends TPluginCallbackKey<
		GFromAppMessageEvent,
		GEventType
	> = TPluginCallbackKey<GFromAppMessageEvent, GEventType>
> {
	key: GPluginCallbackKey;
	type: GEventType;
	once?: boolean;
	callback: (
		instance: FigmaPluginHandler,
		...args: GPluginCallbackArgs[0] extends {
			key: GPluginCallbackKey;
			args: infer TArgs;
		}
			? [args: TArgs]
			: GPluginCallbackArgs
	) => GPluginCallbackReturnValue;
}

export type TPluginCallbackKey<
	GFromAppMessageEvent extends TFromAppMessageEvent,
	GEventType extends keyof TPluginEventTypes<GFromAppMessageEvent>,
	GPluginCallbackArgs extends
		TPluginEventTypes<GFromAppMessageEvent>[GEventType][0] = TPluginEventTypes<GFromAppMessageEvent>[GEventType][0]
> = GPluginCallbackArgs[0] extends {
	key: infer TKey;
}
	? TKey
	: string | undefined;

export interface TPluginEventTypes<GFromAppMessageEvent extends TFromAppMessageEvent> {
	// Events received from Figma
	'run': [[event: RunEvent], Promise<void>];
	'drop': [[event: DropEvent], Promise<void>];
	'documentchange': [[event: DocumentChangeEvent], Promise<void>];
	'textreview': [[event: TextReviewEvent], Promise<TextReviewRange[]>];
	'selectionchange': [[], Promise<void>];
	'currentpagechange': [[], Promise<void>];
	'close': [[], Promise<void>];
	'timerstart': [[], Promise<void>];
	'timerstop': [[], Promise<void>];
	'timerpause': [[], Promise<void>];
	'timerresume': [[], Promise<void>];
	'timeradjust': [[], Promise<void>];
	'timerdone': [[], Promise<void>];

	// Events received from app part
	'app.message': [[event: GFromAppMessageEvent], Promise<void>];
}

export interface TFromAppMessageEvent {
	key: string;
	args: unknown;
}

// =============================================================================
// App
// =============================================================================

export type TAppCallbackRegistration<
	GFromPluginMessageEvent extends TFromPluginMessageEvent = TFromPluginMessageEvent
> = GFromPluginMessageEvent extends TFromPluginMessageEvent
	? {
			[K in keyof TAppEventTypes<TFromPluginMessageEvent>]: TAppCallbackRegistrationBase<
				GFromPluginMessageEvent,
				K
			>;
		}[keyof TAppEventTypes<GFromPluginMessageEvent>]
	: never;

export interface TAppCallbackRegistrationBase<
	GFromPluginMessageEvent extends TFromPluginMessageEvent,
	GEventType extends keyof TAppEventTypes<GFromPluginMessageEvent>,
	GAppCallbackArgs extends
		TAppEventTypes<GFromPluginMessageEvent>[GEventType][0] = TAppEventTypes<GFromPluginMessageEvent>[GEventType][0],
	GAppCallbackReturnValue extends
		TAppEventTypes<GFromPluginMessageEvent>[GEventType][1] = TAppEventTypes<GFromPluginMessageEvent>[GEventType][1],
	GAppCallbackKey extends TAppCallbackKey<GFromPluginMessageEvent, GEventType> = TAppCallbackKey<
		GFromPluginMessageEvent,
		GEventType
	>
> {
	key: GAppCallbackKey;
	type: GEventType;
	once?: boolean;
	callback: (
		instance: FigmaAppHandler,
		...args: GAppCallbackArgs[0] extends {
			key: GAppCallbackKey;
			args: infer TArgs;
		}
			? [
					args: {
						pluginId: string;
					} & TArgs
				]
			: GAppCallbackArgs
	) => GAppCallbackReturnValue;
}

export type TAppCallbackKey<
	GFromPluginMessageEvent extends TFromPluginMessageEvent,
	GEventType extends keyof TAppEventTypes<GFromPluginMessageEvent>,
	GAppCallbackArgs extends
		TAppEventTypes<GFromPluginMessageEvent>[GEventType][0] = TAppEventTypes<GFromPluginMessageEvent>[GEventType][0]
> = GAppCallbackArgs[0] extends {
	key: infer TKey;
}
	? TKey
	: string | undefined;

export type TAppEventTypes<
	GFromPluginMessageEvent extends TFromPluginMessageEvent,
	GWindowCallbackKeys extends keyof WindowEventMap = keyof WindowEventMap
> = {
	// Events received from Window
	[K in GWindowCallbackKeys]: [[event: WindowEventMap[K]], Promise<void>];
} & {
	// Events received from plugin part
	'plugin.message': [[event: GFromPluginMessageEvent], Promise<void>];
};

export interface TFromPluginMessageEvent {
	key: string;
	args: unknown;
}
