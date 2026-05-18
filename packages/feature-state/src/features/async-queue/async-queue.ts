import { defineFeature, type TFeature } from 'feature-core';
import type {
	TListener,
	TListenerCallback,
	TListenerContext,
	TStateBase,
	TStateNotifyOptions
} from '../../types';

/** Adds deferred FIFO listener scheduling to a state. */
export function asyncQueueFeature<GValue>(): TAsyncQueueFeature<GValue> {
	return defineFeature<TAsyncQueueFeature<GValue>>({
		key: 'async-queue',
		overrides: ['listen', 'subscribe', 'notify'],
		install() {
			return {
				notify(this: TStateBase<GValue>, notifyOptions = {}) {
					const { listenerContext = {}, prevValue } = notifyOptions;

					for (const listener of this._listeners) {
						const context: TListenerContext<GValue> = {
							...listenerContext,
							value: this._v,
							prevValue
						};
						asyncListenerQueue.push({
							callback: listener.callback,
							context: context as never
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
	listen(callback: TListenerCallback<GValue>): () => void;
	/** Enqueues listeners and returns a promise that resolves when all have completed. */
	notify(options?: TStateNotifyOptions<GValue>): Promise<void>;
	subscribe(callback: TListenerCallback<GValue>): () => void;
}

// MARK: - Queue

const asyncListenerQueue: TAsyncListenerQueueItem[] = [];
let asyncListenerQueueIndex = 0;
let asyncListenerQueuePromise: Promise<void> | null = null;
let isProcessingAsyncListenerQueue = false;

interface TAsyncListenerQueueItem {
	callback: (context: never) => Promise<void> | void;
	context: never;
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
	const startIndex = isProcessingAsyncListenerQueue ? asyncListenerQueueIndex + 1 : 0;

	for (let i = startIndex; i < asyncListenerQueue.length; i++) {
		if (asyncListenerQueue[i]?.callback === callback) {
			asyncListenerQueue.splice(i, 1);
			i--;
		}
	}
}
