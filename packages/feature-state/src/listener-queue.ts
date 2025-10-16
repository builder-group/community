import { FlatQueue } from './FlatQueue';
import { TListenerQueueItem } from './types';

export const GLOBAL_LISTENER_QUEUES = new Map<string, ListenerQueue>();

export function createListenerQueue(
	key: string,
	options: TCreateListenerQueueOptions
): ListenerQueue {
	const { async = false } = options;
	const queue = async ? new AsyncListenerQueue() : new SyncListenerQueue();
	GLOBAL_LISTENER_QUEUES.set(key, queue);
	return queue;
}

export interface TCreateListenerQueueOptions {
	async?: boolean;
}

export function getListenerQueue(key: string): ListenerQueue | undefined {
	return GLOBAL_LISTENER_QUEUES.get(key);
}

export function processListenerQueue(key: string): void {
	const queue = GLOBAL_LISTENER_QUEUES.get(key);
	if (queue != null) {
		void queue.process();
	}
}

export function processAllListenerQueues(): void {
	for (const [_, queue] of GLOBAL_LISTENER_QUEUES) {
		void queue.process();
	}
}

export class SyncListenerQueue extends FlatQueue<TListenerQueueItem> implements ListenerQueue {
	public process(): void {
		let item: TListenerQueueItem | null;
		while ((item = this.pop()) != null) {
			void item.callback(item.context);
		}
	}
}

export class AsyncListenerQueue extends FlatQueue<TListenerQueueItem> implements ListenerQueue {
	public async process(): Promise<void> {
		let item: TListenerQueueItem | null;
		while ((item = this.pop()) != null) {
			await item.callback(item.context);
		}
	}
}

export interface ListenerQueue extends FlatQueue<TListenerQueueItem> {
	process(): void | Promise<void>;
}
