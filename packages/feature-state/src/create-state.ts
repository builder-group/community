import type { TListener, TListenerCallbackData, TListenerQueueItem, TState } from './types';

const GLOBAL_LISTENER_QUEUE: TListenerQueueItem[] = [];
export const SET_SOURCE_KEY = 'set';

export function createState<GValue>(initialValue: GValue): TState<GValue, []> {
	return {
		_features: [],
		_listeners: [],
		_v: initialValue,
		_notify(notifyOptions = {}) {
			const { processListenerQueue = true, listenerData = {} } = notifyOptions;

			// Push current state's listeners to the queue
			for (const listener of this._listeners) {
				const data: TListenerCallbackData<GValue, []> = Object.assign(listenerData, {
					state: this
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
					processListenerQueue
				});
			}
		},
		listen(callback, listenOptions = {}) {
			const { level = 0, key, queueIf: callIf } = listenOptions;
			const listener: TListener<GValue, []> = {
				key,
				level,
				callback,
				queueIf: callIf
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
			void callback({ state: this });
			return unbind;
		}
	};
}

// TODO: Referencing the state directly causes the queue to always capture latest values (and not value at time of queueing)
export async function processStateQueue(): Promise<void> {
	// Drain the queue
	const queueToProcess = GLOBAL_LISTENER_QUEUE.splice(0, GLOBAL_LISTENER_QUEUE.length);
	queueToProcess.sort((a, b) => a.level - b.level);

	// Process each item in the queue sequentially
	for (const queueItem of queueToProcess) {
		await queueItem.callback(queueItem.data);
	}
}
