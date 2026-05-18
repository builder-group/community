import type { TListenerCallback, TListenerContext } from '../types';
import { FlatQueue } from './FlatQueue';

/** @internal Named listener queues shared across states. */
export const listenerQueues = new Map<string, TListenerQueue>();

/**
 * Creates a listener queue and registers it under `key`.
 */
export function createListenerQueue(
	key: string,
	options: TCreateListenerQueueOptions = {}
): TListenerQueue {
	const { async: isAsync = false } = options;
	const queue = isAsync ? new AsyncListenerQueue() : new SyncListenerQueue();
	listenerQueues.set(key, queue);
	return queue;
}

export interface TCreateListenerQueueOptions {
	/** When true, each listener callback is awaited before the next runs. Defaults to false. */
	async?: boolean;
}

export function getListenerQueue(key: string): TListenerQueue | undefined {
	return listenerQueues.get(key);
}

/** Processes the queue registered under `key`. Returns async queue work so callers can await it. */
export function processListenerQueue(key: string): Promise<void> | void {
	const queue = listenerQueues.get(key);
	if (queue == null) {
		return;
	}

	return queue.process();
}

export class SyncListenerQueue extends FlatQueue<TListenerQueueItem> implements TListenerQueue {
	public process(): void {
		let item: TListenerQueueItem | null;
		while ((item = this.pop()) != null) {
			void item.callback(item.context);
		}
	}
}

export class AsyncListenerQueue extends FlatQueue<TListenerQueueItem> implements TListenerQueue {
	public async process(): Promise<void> {
		let item: TListenerQueueItem | null;
		while ((item = this.pop()) != null) {
			await item.callback(item.context);
		}
	}
}

export interface TListenerQueue extends FlatQueue<TListenerQueueItem> {
	process(): void | Promise<void>;
}

interface TListenerQueueItem<GValue = unknown> {
	callback: TListenerCallback<GValue>;
	context: TListenerContext<GValue>;
}
