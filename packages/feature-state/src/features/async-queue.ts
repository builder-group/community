import { defineFeature, type TFeature } from 'feature-core';
import type {
	TListener,
	TListenerCallback,
	TListenerContext,
	TStateBase,
	TStateNotifyOptions
} from '../types';

/**
 * Defers listener calls to a shared microtask queue instead of running them synchronously.
 * Listeners fire in FIFO order after the current call stack clears. Multiple `notify()` calls
 * before the microtask fires are batched: all listeners join the same queue and the returned
 * promise resolves when every enqueued call has completed.
 *
 * Overrides `listen`, `subscribe`, and `notify`. Do not combine with other features that
 * override `notify`, as the last installed override wins and earlier ones are discarded.
 */
export function asyncQueueFeature<GValue>(): TAsyncQueueFeature<GValue> {
	return defineFeature<TAsyncQueueFeature<GValue>>({
		key: 'async-queue',
		overrides: ['listen', 'subscribe', 'notify'],
		install() {
			return {
				notify(this: TStateBase<GValue>, notifyOptions = {}) {
					const { listenerContext = {}, prevValue } = notifyOptions;

					for (const listener of this._listeners) {
						asyncListenerQueue.push({
							callback: listener.callback,
							context: {
								...listenerContext,
								value: this._v,
								prevValue
							}
						});
					}

					return scheduleAsyncListenerQueue();
				},
				listen(this: TStateBase<GValue>, callback) {
					const listener: TListener<GValue> = {
						callback
					};
					this._listeners.push(listener);

					return () => {
						removeQueuedAsyncListenerCalls(callback);
						const index = this._listeners.indexOf(listener);
						if (index !== -1) {
							this._listeners.splice(index, 1);
						}
					};
				},
				subscribe(this: TStateBase<GValue> & TAsyncQueueFeatureApi<GValue>, callback) {
					const unbind = this.listen(callback);
					// Note: prevValue mirrors value on the initial call so listeners never receive undefined for prevValue
					void callback({ value: this._v, prevValue: this._v });
					return unbind;
				}
			};
		}
	});
}

export type TAsyncQueueFeature<GValue> = TFeature<
	'async-queue',
	TAsyncQueueFeatureApi<GValue>,
	[],
	'listen' | 'notify' | 'subscribe'
>;

export interface TAsyncQueueFeatureApi<GValue> {
	/** Registers a callback for future changes and returns an unsubscribe function. */
	listen(callback: TListenerCallback<GValue>): () => void;
	/** Enqueues listeners and returns a promise that resolves when all have completed. */
	notify(options?: TStateNotifyOptions<GValue>): Promise<void>;
	/** Registers a callback, calls it immediately with the current value, and returns an unsubscribe function. */
	subscribe(callback: TListenerCallback<GValue>): () => void;
}

// MARK: - Queue

const asyncListenerQueue: TAsyncListenerQueueItem[] = [];
let asyncListenerQueueIndex = 0;
let asyncListenerQueuePromise: Promise<void> | null = null;
let isProcessingAsyncListenerQueue = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the shared queue stores listener calls from states with different value types
interface TAsyncListenerQueueItem<GValue = any> {
	callback: TListenerCallback<GValue>;
	context: TListenerContext<GValue>;
}

// Note: Returns the same promise for any notifications batched before the microtask fires
function scheduleAsyncListenerQueue(): Promise<void> {
	asyncListenerQueuePromise ??= Promise.resolve().then(processAsyncListenerQueue);
	return asyncListenerQueuePromise;
}

async function processAsyncListenerQueue(): Promise<void> {
	isProcessingAsyncListenerQueue = true;

	try {
		for (
			asyncListenerQueueIndex = 0;
			asyncListenerQueueIndex < asyncListenerQueue.length;
			asyncListenerQueueIndex++
		) {
			const item = asyncListenerQueue[asyncListenerQueueIndex];
			if (item != null) {
				await item.callback(item.context);
			}
		}
	} finally {
		asyncListenerQueue.length = 0;
		asyncListenerQueueIndex = 0;
		asyncListenerQueuePromise = null;
		isProcessingAsyncListenerQueue = false;
	}
}

function removeQueuedAsyncListenerCalls<GValue>(callback: TListener<GValue>['callback']): void {
	// Note: Unlike the sync queue, items can be pending before the microtask fires, so start from 0 when not yet processing
	const startIndex = isProcessingAsyncListenerQueue ? asyncListenerQueueIndex + 1 : 0;

	for (let i = startIndex; i < asyncListenerQueue.length; i++) {
		if (asyncListenerQueue[i]?.callback === callback) {
			asyncListenerQueue.splice(i, 1);
			i--;
		}
	}
}
