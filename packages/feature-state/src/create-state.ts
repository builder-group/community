import { createFeatureHost } from 'feature-core';
import { SyncListenerQueue, type TListenerQueue } from './queue';
import type { TListener, TListenerContext, TState, TStateBase } from './types';

/**
 * Creates a reactive state container with `value`, `set`, `notify`, `listen`, and `subscribe`.
 *
 * Returns a feature host so capabilities can be added with `.with(feature())`.
 */
export function createState<GValue>(
	initialValue: GValue,
	options: TCreateStateOptions = {}
): TState<GValue, []> {
	type TQueueItem = Parameters<TStateBase<GValue>['_queue']['push']>[0];

	const { queue = defaultListenerQueue } = options;

	const baseState: TStateBase<GValue> = {
		_listeners: [],
		_queue: queue,
		_v: initialValue,
		get value() {
			return this._v;
		},
		set value(newValue) {
			this.set(newValue);
		},
		notify(notifyOptions = {}) {
			const { processListenerQueue = true, listenerContext = {}, prevValue } = notifyOptions;

			for (const listener of this._listeners) {
				const context: TListenerContext<GValue> = {
					...listenerContext,
					value: this._v,
					prevValue
				};
				// Note: queues can be shared by states with different value types
				this._queue.push(
					{
						callback: listener.callback,
						context
					} as TQueueItem,
					listener
				);
			}

			if (processListenerQueue) {
				void this._queue.process();
			}
		},
		get() {
			return this._v;
		},
		set(newValueOrUpdater, setOptions = {}) {
			const newValue =
				typeof newValueOrUpdater === 'function'
					? (newValueOrUpdater as (value: GValue) => GValue)(this._v)
					: newValueOrUpdater;
			const prevValue = this._v;
			if (Object.is(prevValue, newValue)) {
				return;
			}

			const { listenerContext = {}, processListenerQueue = true } = setOptions;
			this._v = newValue;
			this.notify({
				listenerContext: {
					...listenerContext,
					source: listenerContext.source ?? setSourceKey
				},
				processListenerQueue,
				prevValue
			});
		},
		listen(callback, listenOptions = {}) {
			const listener: TListener<GValue> = {
				...listenOptions,
				callback
			};
			this._listeners.push(listener);

			return () => {
				this._queue.removeWhere((item) => item.callback === callback);
				const index = this._listeners.indexOf(listener);
				if (index !== -1) {
					this._listeners.splice(index, 1);
				}
			};
		},
		subscribe(callback, subscribeOptions) {
			const unbind = this.listen(callback, subscribeOptions);
			// Note: prevValue mirrors value on the initial call so listeners never receive undefined for prevValue
			void callback({ value: this._v, prevValue: this._v });
			return unbind;
		}
	};

	return createFeatureHost(baseState);
}

// Note: Defaults to sync FIFO because sync avoids deferred-update side effects and FIFO keeps
// registration order, which is the least surprising default for most use cases
// https://evilmartians.com/chronicles/how-to-avoid-tricky-async-state-manager-pitfalls-react
const defaultListenerQueue = new SyncListenerQueue();

/** Source key set on the listener context when a value is changed via `set()`. */
export const setSourceKey = 'state_set';

export interface TCreateStateOptions {
	/** Listener queue used to schedule and process callbacks. Defaults to a shared sync queue. */
	queue?: TListenerQueue;
}
