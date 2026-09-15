import { createFeatureHost } from 'feature-core';
import { registerStateListener } from './register-state-listener';
import type { TListener, TListenerCallback, TListenerContext, TState, TStateBase } from './types';

/**
 * Creates a reactive state container.
 *
 * The state exposes `value`, `get()`, `set()`, `notify()`, `listen()`, and `subscribe()`.
 * `set()` skips notification when the new value equals the current one (`Object.is`).
 * Extend the state with features by calling `.with(feature())`.
 */
export function createState<GValue>(initialValue: GValue): TState<GValue, []> {
	return createFeatureHost<TStateBase<GValue>>({
		_listeners: [],
		_version: 0,
		_value: initialValue,
		get value() {
			return this._value;
		},
		set value(newValue) {
			this.set(newValue);
		},
		notify(notifyOptions = {}) {
			this._version++;
			const { listenerContext = {}, prevValue } = notifyOptions;
			// Note: Only the outermost notify drains the queue. Nested notify calls append work to the active flush.
			const shouldProcessListenerQueue = !listenerQueue.length;

			for (const listener of this._listeners) {
				listenerQueue.push({
					callback: listener.callback,
					context: {
						...listenerContext,
						value: this._value,
						prevValue
					}
				});
			}

			if (shouldProcessListenerQueue) {
				processListenerQueue();
			}
		},
		get() {
			return this._value;
		},
		set(newValueOrUpdater, setOptions = {}) {
			const newValue =
				typeof newValueOrUpdater === 'function'
					? (newValueOrUpdater as (value: GValue) => GValue)(this._value)
					: newValueOrUpdater;
			const prevValue = this._value;
			if (Object.is(prevValue, newValue)) {
				return;
			}

			const { listenerContext = {} } = setOptions;
			this._value = newValue;
			this.notify({
				listenerContext: {
					...listenerContext,
					source: listenerContext.source ?? setSourceKey
				},
				prevValue
			});
		},
		listen(callback) {
			const listener: TListener<GValue> = {
				callback
			};
			return registerStateListener(this, listener, removeQueuedListenerCalls);
		},
		subscribe(callback) {
			const unbind = this.listen(callback);
			// Note: prevValue mirrors value on the initial call so listeners never receive undefined for prevValue
			void callback({ value: this._value, prevValue: this._value });
			return unbind;
		}
	});
}

/** Source key set on the listener context when a value is changed via `set()`. */
export const setSourceKey = 'stateSet';

// MARK: - Queue

const listenerQueue: TListenerQueueItem[] = [];
let listenerQueueIndex = 0;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the shared queue stores listener calls from states with different value types
interface TListenerQueueItem<GValue = any> {
	callback: TListenerCallback<GValue>;
	context: TListenerContext<GValue>;
}

function processListenerQueue(): void {
	try {
		for (listenerQueueIndex = 0; listenerQueueIndex < listenerQueue.length; listenerQueueIndex++) {
			const item = listenerQueue[listenerQueueIndex];
			if (item != null) {
				void item.callback(item.context);
			}
		}
	} finally {
		listenerQueue.length = 0;
		listenerQueueIndex = 0;
	}
}

function removeQueuedListenerCalls<GValue>(callback: TListener<GValue>['callback']): void {
	for (let i = listenerQueueIndex + 1; i < listenerQueue.length; i++) {
		if (listenerQueue[i]?.callback === callback) {
			listenerQueue.splice(i, 1);
			i--;
		}
	}
}
