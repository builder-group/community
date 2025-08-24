import { createQueue, getQueue } from './queue';
import type { TListener, TListenerContext, TState } from './types';

export const SET_SOURCE_KEY = 'state_set';

export function createState<GValue>(
	initialValue: GValue,
	options: TCreateStateOptions = {}
): TState<GValue, []> {
	const { queue: queueName = 'async' } = options;

	let queue = getQueue(queueName);
	if (queue == null) {
		// Auto-create any queue - sync if named 'sync', otherwise async
		queue = createQueue(queueName, { sync: queueName === 'sync' });
	}

	return {
		_features: [],
		_listeners: [],
		_v: initialValue,
		_queue: queue,
		_notify(notifyOptions = {}) {
			const { processListenerQueue = true, listenerContext = {}, prevValue } = notifyOptions;

			// Push all listeners to the state's queue
			for (const listener of this._listeners) {
				const context: TListenerContext<GValue> = Object.assign(listenerContext, {
					value: this._v,
					prevValue
				});
				if (listener.queueIf == null || listener.queueIf(context)) {
					this._queue.push(
						{
							context,
							callback: listener.callback
						},
						listener.priority
					);
				}
			}

			// Process the state's queue
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
			if (prevValue !== newValue) {
				const { listenerContext = {}, processListenerQueue = true } = setOptions;
				listenerContext.source = listenerContext.source ?? SET_SOURCE_KEY;
				this._v = newValue;
				this._notify({
					listenerContext,
					processListenerQueue,
					prevValue
				});
			}
		},
		listen(callback, listenOptions = {}) {
			const { priority = EStateListenerQueuePriority.DEFAULT, key, queueIf } = listenOptions;
			const listener: TListener<GValue> = {
				key,
				priority,
				callback,
				queueIf
			};
			this._listeners.push(listener);

			// Unbind
			return () => {
				const index = this._listeners.indexOf(listener);
				if (index !== -1) {
					this._listeners.splice(index, 1);
				}
			};
		},
		subscribe(callback, subscribeOptions) {
			const unbind = this.listen(callback, subscribeOptions);
			void callback({ value: this._v, prevValue: this._v });
			return unbind;
		}
	};
}

export interface TCreateStateOptions {
	queue?: 'sync' | 'async' | string;
}

export enum EStateListenerQueuePriority {
	EARLY = 50,
	DEFAULT = 100,
	LATE = 200
}
