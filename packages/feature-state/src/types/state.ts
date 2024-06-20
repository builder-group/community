import type { TFeatureKeys, TSelectFeatures } from './features';

export type TState<GValue, GSelectedFeatureKeys extends TFeatureKeys<GValue>[]> = {
	_features: string[];
	_value: GValue;
	_listeners: TListener<GValue>[];
	/**
	 * Triggers all registered listeners to run with the current state value.
	 */
	_notify: (options?: TStateNotifyOptions) => void;
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
	 * @param newValue - The new value to set for the state, of type `GValue`.
	 */
	set: (newValue: GValue, options?: TStateSetOptions) => void;
	/**
	 * Subscribes to state changes without immediately invoking the callback.
	 * Use this to listen for changes that occur after the subscription.
	 *
	 * @param callback - The callback function to execute when the state changes.
	 * @param level - Optional parameter to specify the listener's priority level.
	 * @returns A function that, when called, will unsubscribe the listener.
	 */
	listen: (callback: TListenerCallback<GValue>, level?: number) => () => void;
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
	subscribe: (callback: TListenerCallback<GValue>, level?: number) => () => void;
} & TSelectFeatures<GValue, GSelectedFeatureKeys>;

export type TListenerCallback<GValue> = (
	props: TListenerCallbackProps<GValue>
) => Promise<void> | void;

export interface TListenerCallbackProps<GValue> {
	value: Readonly<GValue>;
	data?: unknown;
}

export interface TListener<GValue> {
	callback: TListenerCallback<GValue>;
	level: number;
}

// TODO: Should we pass no reference to the state and/or value
// and instead just directly access the state in the listener callback?
// https://stackoverflow.com/questions/78645591/best-practices-for-managing-object-references-in-callbacks-javascript
export type TListenerQueueItem<GValue = any> = {
	value: Readonly<GValue>;
	data?: unknown;
} & TListener<GValue>;

export type TStateSetOptions = TStateNotifyOptions;

export interface TStateNotifyOptions {
	processListenerQueue?: boolean;
	listenerData?: unknown;
}
