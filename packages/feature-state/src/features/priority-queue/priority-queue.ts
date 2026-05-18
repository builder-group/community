import { defineFeature, type TFeature } from 'feature-core';
import type {
	TListener,
	TListenerCallback,
	TListenerContext,
	TStateBase,
	TStateNotifyOptions
} from '../../types';
import { FlatQueue } from './FlatQueue';

/** Adds priority-based listener scheduling to a state. */
export function priorityQueueFeature<GValue>(): TPriorityQueueFeature<GValue> {
	return defineFeature<TPriorityQueueFeature<GValue>>({
		key: 'priority-queue',
		overrides: ['listen', 'subscribe', 'notify'],
		install() {
			return {
				notify(this: TStateBase<GValue>, notifyOptions = {}) {
					const { listenerContext = {}, prevValue } = notifyOptions;

					for (const listener of this._listeners) {
						const priority = getListenerPriority(listener);
						const context: TListenerContext<GValue> = {
							...listenerContext,
							value: this._v,
							prevValue
						};
						priorityListenerQueue.push(
							{
								callback: listener.callback,
								context: context as never
							},
							priority
						);
					}

					if (!isProcessingPriorityListenerQueue) {
						processPriorityListenerQueue();
					}
				},
				listen(this: TStateBase<GValue>, callback, options = {}) {
					const listener: TPriorityListener<GValue> = {
						callback,
						priority: options.priority ?? EListenerPriority.DEFAULT
					};
					this._listeners.push(listener);

					return () => {
						removeQueuedPriorityListenerCalls(callback);
						const index = this._listeners.indexOf(listener);
						if (index !== -1) {
							this._listeners.splice(index, 1);
						}
					};
				},
				subscribe(this: TStateBase<GValue> & TPriorityQueueFeatureApi<GValue>, callback, options) {
					const unbind = this.listen(callback, options);
					// Note: prevValue mirrors value on the initial call so listeners never receive undefined for prevValue
					void callback({ value: this._v, prevValue: this._v });
					return unbind;
				}
			};
		}
	});
}

export type TPriorityQueueFeature<GValue> = TFeature<
	'priority-queue',
	TPriorityQueueFeatureApi<GValue>,
	[],
	'listen' | 'notify' | 'subscribe'
>;

export interface TPriorityQueueFeatureApi<GValue> {
	listen(callback: TListenerCallback<GValue>, options?: TPriorityListenerOptions): () => void;
	notify(options?: TStateNotifyOptions<GValue>): void;
	subscribe(callback: TListenerCallback<GValue>, options?: TPriorityListenerOptions): () => void;
}

export interface TPriorityListenerOptions {
	/** Determines execution order relative to other listeners. Lower values run first. */
	priority?: number;
}

/** Listener priority values. Lower values are processed earlier. */
export enum EListenerPriority {
	FIRST = 0,
	EARLY = 125,
	DEFAULT = 250,
	LATE = 375,
	LAST = 500
}

interface TPriorityListener<GValue> extends TListener<GValue> {
	priority: number;
}

function getListenerPriority<GValue>(listener: TListener<GValue>): number {
	return 'priority' in listener && typeof listener.priority === 'number'
		? listener.priority
		: EListenerPriority.DEFAULT;
}

// MARK: - Queue

const priorityListenerQueue = new FlatQueue<TPriorityListenerQueueItem>();
let isProcessingPriorityListenerQueue = false;

interface TPriorityListenerQueueItem {
	callback: (context: never) => Promise<void> | void;
	context: never;
}

function processPriorityListenerQueue(): void {
	isProcessingPriorityListenerQueue = true;

	try {
		let item: TPriorityListenerQueueItem | null;
		while ((item = priorityListenerQueue.pop()) != null) {
			void item.callback(item.context);
		}
	} finally {
		priorityListenerQueue.clear();
		isProcessingPriorityListenerQueue = false;
	}
}

function removeQueuedPriorityListenerCalls<GValue>(callback: TListener<GValue>['callback']): void {
	priorityListenerQueue.removeWhere((item) => item.callback === callback);
}
