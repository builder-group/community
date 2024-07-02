import type { TListener, TListenerQueueItem, TState } from './types';

const GLOBAL_LISTENER_QUEUE: TListenerQueueItem[] = [];

export function createState<GValue>(
	initialValue: GValue,
	options: TCreateStateOptions = {}
): TState<GValue, ['base']> {
	const { deferred = true } = options;

	return {
		_: null,
		_features: ['base'],
		_listeners: [],
		_value: initialValue,
		_notify(notifyOptions = {}) {
			const { processListenerQueue = true, additionalData = {} } = notifyOptions;

			// Push current state's listeners to the queue
			this._listeners.forEach((listener) => {
				GLOBAL_LISTENER_QUEUE.push({
					data: { ...additionalData, value: this._value as Readonly<GValue> },
					callback: listener.callback,
					level: listener.level
				});
			});

			// Process queue
			if (processListenerQueue) {
				// Defer processing using setTimeout
				deferred
					? setTimeout(() => {
							void processQueue();
						})
					: void processQueue();
			}
		},
		get() {
			return this._value;
		},
		set(newValue, setOptions = {}) {
			if (this._value !== newValue) {
				const { additionalData = {}, processListenerQueue = true } = setOptions;
				additionalData.source = additionalData.source ?? 'set';
				this._value = newValue;
				this._notify({
					additionalData,
					processListenerQueue
				});
			}
		},
		listen(callback, listenOptions = {}) {
			const { level = 0, key } = listenOptions;
			const listener: TListener<GValue> = {
				key,
				level,
				callback
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
			void callback({ value: this._value });
			return unbind;
		}
	};
}

export interface TCreateStateOptions {
	deferred?: boolean;
}

async function processQueue(): Promise<void> {
	// Drain the queue
	const queueToProcess = GLOBAL_LISTENER_QUEUE.splice(0, GLOBAL_LISTENER_QUEUE.length);
	queueToProcess.sort((a, b) => a.level - b.level);

	// Process each item in the queue sequentially
	for (const queueItem of queueToProcess) {
		await queueItem.callback(queueItem.data);
	}
}
