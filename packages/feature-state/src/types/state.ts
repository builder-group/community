import type { TPrimitive } from '@ibg/utils';

import type { TFeatureKeys, TSelectFeatures } from './features';

export type TState<GValue, GSelectedFeatureKeys extends TFeatureKeys<GValue>[]> = {
	_features: string[];
	_value: GValue;
	_listeners: TListener<GValue>[];
	/**
	 * Retrieves the current state value.
	 *
	 * Example usage:
	 * ```js
	 * const currentState = MY_STATE.get();
	 * ```
	 *
	 * @returns The current state value of type `GValue`.
	 */
	get: () => GValue;
	/**
	 * Updates the state value.
	 *
	 * Example usage:
	 * ```js
	 * MY_STATE.set("Hello World");
	 * ```
	 *
	 * @param newValue - The new value to set for the state, of type `GValue`.
	 */
	set: (newValue: GValue) => void;
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
	 * Example usage:
	 * ```js
	 * import { MY_STATE } from '../controller';
	 *
	 * const unsubscribe = MY_STATE.subscribe(value => {
	 *   console.log(value);
	 * });
	 * ```
	 *
	 * @param callback - The callback function to execute when the state changes.
	 * @param level - Optional parameter to specify the listener's priority level.
	 * @returns A function that, when called, will unsubscribe the listener.
	 */
	subscribe: (callback: TListenerCallback<GValue>, level?: number) => () => void;
	/**
	 * Triggers all registered listeners to run with the current state value.
	 */
	_notify: (process: boolean) => void;
} & TSelectFeatures<GValue, GSelectedFeatureKeys>;

type TListenerCallback<GValue> = (value: TReadonlyIfObject<GValue>) => Promise<void> | void;
export interface TListener<GValue> {
	callback: TListenerCallback<GValue>;
	level: number;
}

export type TListenerQueueItem<GValue = unknown> = { value: GValue } & TListener<GValue>;

export type TReadonlyIfObject<GValue> = GValue extends undefined
	? GValue
	: GValue extends (...args: any) => any
		? GValue
		: GValue extends TPrimitive
			? GValue
			: GValue extends object
				? Readonly<GValue>
				: GValue;
