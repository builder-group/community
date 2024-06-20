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
			const { processListenerQueue = true, listenerData } = notifyOptions;

			// Add current state's listeners to the queue
			this._listeners.forEach((listener) => {
				GLOBAL_LISTENER_QUEUE.push({
					stateRef: new WeakRef(this),
					data: listenerData,
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
				this._value = newValue;
				this._notify(setOptions);
			}
		},
		listen(callback, level) {
			const listener: TListener<GValue, ['base']> = {
				callback,
				level: level ?? 0
			};
			this._listeners.push(listener);

			// Undbind
			return () => {
				const index = this._listeners.indexOf(listener);
				// eslint-disable-next-line no-bitwise -- .
				if (~index) {
					this._listeners.splice(index, 1);
				}
			};
		},
		subscribe(callback, level) {
			const unbind = this.listen(callback, level);
			void callback({ state: this });
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
		const state = queueItem.stateRef.deref();
		if (state != null) {
			await queueItem.callback({
				state,
				data: queueItem.data
			});
		} else {
			console.warn('Reference to State was dropped before listener could be called!');
		}
	}
}
