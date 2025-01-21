import { TWithFeatures, type TFeatureDefinition } from '@blgc/types/features';
import { type TNestedPath } from '@blgc/utils';

export type TState<GValue, GFeatures extends TFeatureDefinition[]> = TWithFeatures<
	{
		_v: GValue;
		_listeners: TListener<GValue, GFeatures>[];
		/**
		 * Triggers all registered listeners to run with the current state value.
		 */
		_notify: (options?: TStateNotifyOptions<GValue>) => void;
		/**
		 * Retrieves the current state value.
		 *
		 * @example
		 * ```js
		 * const currentState = $state.get();
		 * ```
		 *
		 * @returns The current state value of type `GValue`.
		 */
		get: () => Readonly<GValue>;
		/**
		 * Updates the state value.
		 *
		 * @example
		 * ```js
		 * $state.set("Hello World");
		 * ```
		 *
		 * @param newValueOrUpdater - The new value to set for the state, of type `GValue`.
		 */
		set: (
			newValueOrUpdater: GValue | ((value: GValue) => GValue),
			options?: TStateSetOptions<GValue>
		) => void;
		/**
		 * Subscribes to state changes without immediately invoking the callback.
		 * Use this to listen for changes that occur after the subscription.
		 *
		 * @param callback - The callback function to execute when the state changes.
		 * @param level - Optional parameter to specify the listener's priority level.
		 * @returns A function that, when called, will unsubscribe the listener.
		 */
		listen: (
			callback: TListenerCallback<GValue, GFeatures>,
			options?: TListenerOptions<GValue, GFeatures>
		) => () => void;
		/**
		 * Subscribes to state changes and invokes the callback immediately with the current state value.
		 *
		 * @example
		 * ```js
		 * import { $state } from '../store';
		 *
		 * const unsubscribe = $state.subscribe(value => {
		 *   console.log(value);
		 * });
		 * ```
		 *
		 * @param callback - The callback function to execute when the state changes.
		 * @param level - Optional parameter to specify the listener's priority level.
		 * @returns A function that, when called, will unsubscribe the listener.
		 */
		subscribe: (
			callback: TListenerCallback<GValue, GFeatures>,
			options?: Partial<Omit<TListener<GValue, GFeatures>, 'callback'>>
		) => () => void;
	},
	GFeatures
>;

export type TListenerCallback<GValue, GFeatures extends TFeatureDefinition[]> = (
	data: TListenerCallbackData<GValue, GFeatures>
) => Promise<void> | void;

// TODO: Reference state or just value, because it will be pushed into a global queue?
// https://stackoverflow.com/questions/78645591/best-practices-for-managing-object-references-in-callbacks-javascript
export interface TListenerCallbackData<GValue, GFeatures extends TFeatureDefinition[]>
	extends TAdditionalListenerCallbackData<GValue> {
	state: TState<GValue, GFeatures>;
}

export interface TAdditionalListenerCallbackData<GValue> {
	[key: string]: unknown;
	source?: string;
	background?: boolean;
	changedProperties?: TNestedPath<GValue>[];
}

export interface TListener<GValue, GFeatures extends TFeatureDefinition[]> {
	key?: string;
	level: number;
	callback: TListenerCallback<GValue, GFeatures>;
	queueIf?: (data: TListenerCallbackData<GValue, GFeatures>) => boolean;
}

export type TListenerOptions<GValue, GFeatures extends TFeatureDefinition[]> = Partial<
	Omit<TListener<GValue, GFeatures>, 'callback'>
>;

export interface TListenerQueueItem<GValue = any> {
	level: TListener<GValue, []>['level'];
	callback: TListener<GValue, []>['callback'];
	data: TListenerCallbackData<GValue, []>;
}

export interface TStateNotifyOptions<GValue> {
	processListenerQueue?: boolean;
	listenerData?: TAdditionalListenerCallbackData<GValue>;
}

export type TStateSetOptions<GValue> = Omit<TStateNotifyOptions<GValue>, 'prevValue'>;
