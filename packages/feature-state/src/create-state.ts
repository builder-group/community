import type { TListener, TListenerCallbackData, TListenerQueueItem, TState } from './types';

const GLOBAL_LISTENER_QUEUE: TListenerQueueItem[] = [];
export const SET_SOURCE_KEY = 'set';

export function createState<GValue>(initialValue: GValue): TState<GValue, []> {
	return {
		_features: [],
		_listeners: [],
		_v: initialValue,
		_notify(notifyOptions = {}) {
			const { processListenerQueue = true, listenerData = {}, prevValue } = notifyOptions;

			// Push current state's listeners to the queue
			for (const listener of this._listeners) {
				const data: TListenerCallbackData<GValue> = Object.assign(listenerData, {
					value: this._v,
					prevValue
				});
				if (listener.queueIf == null || listener.queueIf(data)) {
					GLOBAL_LISTENER_QUEUE.push({
						data,
						callback: listener.callback,
						level: listener.level
					});
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
				const { listenerData = {}, processListenerQueue = true } = setOptions;
				listenerData.source = listenerData.source ?? SET_SOURCE_KEY;
				this._v = newValue;
				this._notify({
					listenerData,
					processListenerQueue,
					prevValue
				});
			}
		},
		listen(callback, listenOptions = {}) {
			const { level = 0, key, queueIf } = listenOptions;
			const listener: TListener<GValue> = {
				key,
				level,
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
			void callback({ value: this._v });
			return unbind;
		}
	};
}

export async function processStateQueue(): Promise<void> {
	// Drain the queue
	const toProcess = GLOBAL_LISTENER_QUEUE.splice(0, GLOBAL_LISTENER_QUEUE.length);
	toProcess.sort((a, b) => a.level - b.level);

	// Process each item in the queue sequentially
	for (const queueItem of toProcess) {
		await queueItem.callback(queueItem.data);
	}
}
