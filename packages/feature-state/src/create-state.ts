import FlatQueue from 'flatqueue';
import type { TListener, TListenerContext, TListenerQueueItem, TState } from './types';

const GLOBAL_LISTENER_QUEUE = new FlatQueue<TListenerQueueItem>();
export const SET_SOURCE_KEY = 'state_set';

export function createState<GValue>(initialValue: GValue): TState<GValue, []> {
	return {
		_features: [],
		_listeners: [],
		_v: initialValue,
		_notify(notifyOptions = {}) {
			const { processListenerQueue = true, listenerContext = {}, prevValue } = notifyOptions;

			// Push current state's listeners to the queue
			for (const listener of this._listeners) {
				const context: TListenerContext<GValue> = Object.assign(listenerContext, {
					value: this._v,
					prevValue
				});
				if (listener.queueIf == null || listener.queueIf(context)) {
					GLOBAL_LISTENER_QUEUE.push(
						{
							context,
							callback: listener.callback
						},
						listener.priority
					);
				}
			}

			// Process queue
			if (processListenerQueue) {
				void processStateQueue();
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

			// Undbind
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

export enum EStateListenerQueuePriority {
	EARLY = 50,
	DEFAULT = 100,
	LATE = 200
}

export async function processStateQueue(): Promise<void> {
	let item: TListenerQueueItem | undefined;
	while ((item = GLOBAL_LISTENER_QUEUE.pop()) != null) {
		await item.callback(item.context);
	}
}
