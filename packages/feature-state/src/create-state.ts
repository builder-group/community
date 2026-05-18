import { createFeatureHost } from 'feature-core';
import type { TListener, TListenerContext, TState, TStateBase } from './types';

/**
 * Creates a reactive state container with `value`, `set`, `notify`, `listen`, and `subscribe`.
 *
 * Returns a feature host so capabilities can be added with `.with(feature())`.
 */
export function createState<GValue>(initialValue: GValue): TState<GValue, []> {
	const baseState: TStateBase<GValue> = {
		_listeners: [],
		_v: initialValue,
		get value() {
			return this._v;
		},
		set value(newValue) {
			this.set(newValue);
		},
		notify(notifyOptions = {}) {
			const { listenerContext = {}, prevValue } = notifyOptions;
			// Note: Only the outermost notify drains the queue; nested notify calls append work to the active flush
			const shouldProcessListenerQueue = !listenerQueue.length;

			for (const listener of this._listeners) {
				const context: TListenerContext<GValue> = {
					...listenerContext,
					value: this._v,
					prevValue
				};
				listenerQueue.push({
					callback: listener.callback,
					context: context as never
				});
			}

			if (shouldProcessListenerQueue) {
				processListenerQueue();
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

			const { listenerContext = {} } = setOptions;
			this._v = newValue;
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
			this._listeners.push(listener);

			return () => {
				removeQueuedListenerCalls(callback);
				const index = this._listeners.indexOf(listener);
				if (index !== -1) {
					this._listeners.splice(index, 1);
				}
			};
		},
		subscribe(callback) {
			const unbind = this.listen(callback);
			// Note: prevValue mirrors value on the initial call so listeners never receive undefined for prevValue
			void callback({ value: this._v, prevValue: this._v });
			return unbind;
		}
	};

	return createFeatureHost(baseState);
}

/** Source key set on the listener context when a value is changed via `set()`. */
export const setSourceKey = 'state_set';

// MARK: - Queue

const listenerQueue: TListenerQueueItem[] = [];
let listenerQueueIndex = 0;

interface TListenerQueueItem {
	callback: (context: never) => Promise<void> | void;
	context: never;
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
