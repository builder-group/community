import type { TFeatureKeys, TSelectFeatures } from './features';

export type TState<GValue, GSelectedFeatureKeys extends TFeatureKeys<GValue>[]> = {
	_features: string[];
	_value: GValue;
	_listeners: TListener<GValue, GSelectedFeatureKeys>[];
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
	listen: (callback: TListenerCallback<GValue, GSelectedFeatureKeys>, level?: number) => () => void;
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
		callback: TListenerCallback<GValue, GSelectedFeatureKeys>,
		level?: number
	) => () => void;
} & TSelectFeatures<GValue, GSelectedFeatureKeys>;

export type TListenerCallback<GValue, GSelectedFeatureKeys extends TFeatureKeys<GValue>[]> = (
	props: TListenerCallbackProps<GValue, GSelectedFeatureKeys>
) => Promise<void> | void;

export interface TListenerCallbackProps<
	GValue,
	GSelectedFeatureKeys extends TFeatureKeys<GValue>[]
> {
	state: TState<GValue, GSelectedFeatureKeys>;
	data?: unknown;
}

export interface TListener<GValue, GSelectedFeatureKeys extends TFeatureKeys<GValue>[]> {
	callback: TListenerCallback<GValue, GSelectedFeatureKeys>;
	level: number;
}

export type TListenerQueueItem<
	GValue = any,
	GSelectedFeatureKeys extends TFeatureKeys<GValue>[] = ['base']
> = {
	state: TState<GValue, GSelectedFeatureKeys>;
	data?: unknown;
} & TListener<GValue, GSelectedFeatureKeys>;

export type TStateSetOptions = TStateNotifyOptions;

export interface TStateNotifyOptions {
	processListenerQueue?: boolean;
	listenerData?: unknown;
}
