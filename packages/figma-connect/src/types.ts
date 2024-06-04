import type { FigmaAppHandler } from './app';
import type { FigmaPluginHandler } from './plugin';

// =============================================================================
// Plugin
// =============================================================================

export type TPluginCallbackRegistration<
	GAppMessageEvent extends TAppMessageEvent = TAppMessageEvent
> = GAppMessageEvent extends TAppMessageEvent
	? {
			[K in keyof TPluginEventTypes<TAppMessageEvent>]: TPluginCallbackRegistrationBase<
				GAppMessageEvent,
				K
			>;
	  }[keyof TPluginEventTypes<GAppMessageEvent>]
	: never;

export interface TPluginCallbackRegistrationBase<
	GAppMessageEvent extends TAppMessageEvent,
	GEventType extends keyof TPluginEventTypes<GAppMessageEvent>,
	GPluginCallbackArgs extends
		TPluginEventTypes<GAppMessageEvent>[GEventType][0] = TPluginEventTypes<GAppMessageEvent>[GEventType][0],
	GPluginCallbackReturnValue extends
		TPluginEventTypes<GAppMessageEvent>[GEventType][1] = TPluginEventTypes<GAppMessageEvent>[GEventType][1],
	GPluginCallbackKey extends TPluginCallbackKey<GAppMessageEvent, GEventType> = TPluginCallbackKey<
		GAppMessageEvent,
		GEventType
	>
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
	GAppMessageEvent extends TAppMessageEvent,
	GEventType extends keyof TPluginEventTypes<GAppMessageEvent>,
	GPluginCallbackArgs extends
		TPluginEventTypes<GAppMessageEvent>[GEventType][0] = TPluginEventTypes<GAppMessageEvent>[GEventType][0]
> = GPluginCallbackArgs[0] extends {
	key: infer TKey;
}
	? TKey
	: string | undefined;

export interface TPluginEventTypes<GAppMessageEvent extends TAppMessageEvent> {
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
	'app.message': [[event: GAppMessageEvent], Promise<void>];
}

export interface TAppMessageEvent {
	key: string;
	args: unknown;
}

// Testing

// export interface TOnAppMessageEvent2 extends TAppMessageEvent {
// 	key: 'on-event-2';
// 	args: {
// 		arg1: number;
// 		arg2: string;
// 	};
// }

// export interface TOnAppMessageEvent1 extends TAppMessageEvent {
// 	key: 'on-event-1';
// 	args: {
// 		arg1: null;
// 		arg2: number;
// 		arg3: string;
// 	};
// }

// export type TAppMessageEvents = TOnAppMessageEvent1 | TOnAppMessageEvent2;

// const test: TPluginCallbackRegistration<TAppMessageEvents> = {
// 	type: 'run',
// 	key: undefined,
// 	callback: async (instance, event) => {
// 		// Event received by Figma
// 	}
// };

// const test2: TPluginCallbackRegistration<TAppMessageEvents> = {
// 	type: 'app.message',
// 	key: 'on-event-1',
// 	callback: async (instance, event) => {
// 		// Event received by plugin part
// 	}
// };

// const test3: TPluginCallbackRegistration<TAppMessageEvents> = {
// 	type: 'textreview',
// 	key: undefined,
// 	callback: async (instance, event) => {
// 		// Event received by Figma
// 		return [];
// 	}
// };

// =============================================================================
// App
// =============================================================================

export type TAppCallbackRegistration<
	GPluginMessageEvent extends TPluginMessageEvent = TPluginMessageEvent
> = GPluginMessageEvent extends TPluginMessageEvent
	? {
			[K in keyof TAppEventTypes<TPluginMessageEvent>]: TAppCallbackRegistrationBase<
				GPluginMessageEvent,
				K
			>;
	  }[keyof TAppEventTypes<GPluginMessageEvent>]
	: never;

export interface TAppCallbackRegistrationBase<
	GPluginMessageEvent extends TPluginMessageEvent,
	GEventType extends keyof TAppEventTypes<GPluginMessageEvent>,
	GAppCallbackArgs extends
		TAppEventTypes<GPluginMessageEvent>[GEventType][0] = TAppEventTypes<GPluginMessageEvent>[GEventType][0],
	GAppCallbackReturnValue extends
		TAppEventTypes<GPluginMessageEvent>[GEventType][1] = TAppEventTypes<GPluginMessageEvent>[GEventType][1],
	GAppCallbackKey extends TAppCallbackKey<GPluginMessageEvent, GEventType> = TAppCallbackKey<
		GPluginMessageEvent,
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
	GPluginMessageEvent extends TPluginMessageEvent,
	GEventType extends keyof TAppEventTypes<GPluginMessageEvent>,
	GAppCallbackArgs extends
		TAppEventTypes<GPluginMessageEvent>[GEventType][0] = TAppEventTypes<GPluginMessageEvent>[GEventType][0]
> = GAppCallbackArgs[0] extends {
	key: infer TKey;
}
	? TKey
	: string | undefined;

export type TAppEventTypes<
	GPluginMessageEvent extends TPluginMessageEvent,
	GWindowCallbackKeys extends keyof WindowEventMap = keyof WindowEventMap
> = {
	// Events received from Window
	[K in GWindowCallbackKeys]: [[event: WindowEventMap[K]], Promise<void>];
} & {
	// Events received from plugin part
	'plugin.message': [[event: GPluginMessageEvent], Promise<void>];
};

export interface TPluginMessageEvent {
	key: string;
	args: unknown;
}

// Testing

// export interface TOnPluginMessageEvent2 extends TPluginMessageEvent {
// 	key: 'on-event-2';
// 	args: {
// 		arg1: number;
// 		arg2: string;
// 	};
// }

// export interface TOnPluginMessageEvent1 extends TPluginMessageEvent {
// 	key: 'on-event-1';
// 	args: {
// 		arg1: null;
// 		arg2: number;
// 		arg3: string;
// 	};
// }

// export type TPluginMessageEvents = TOnPluginMessageEvent1 | TOnPluginMessageEvent2;

// const test: TAppCallbackRegistration<TPluginMessageEvents> = {
// 	type: 'DOMContentLoaded',
// 	key: undefined,
// 	callback: async (instance, event) => {
// 		// Event received by Window
// 	}
// };

// const test2: TAppCallbackRegistration<TPluginMessageEvents> = {
// 	type: 'plugin.message',
// 	key: 'on-event-1',
// 	callback: async (instance, event) => {
// 		// Event received by plugin part
// 	}
// };
