import { ListenerQueue, TListenerQueueOptions } from './ListenerQueue';

export const GLOBAL_STATE_QUEUES = new Map<string, ListenerQueue>();

export function createQueue(key: string, options: TListenerQueueOptions): ListenerQueue {
	const queue = new ListenerQueue(options);
	GLOBAL_STATE_QUEUES.set(key, queue);
	return queue;
}

export function getQueue(key: string): ListenerQueue | undefined {
	return GLOBAL_STATE_QUEUES.get(key);
}

export function processQueue(key: string): void {
	const queue = GLOBAL_STATE_QUEUES.get(key);
	if (queue != null) {
		void queue.process();
	}
}

export function processAllQueues(): void {
	for (const [_, queue] of GLOBAL_STATE_QUEUES) {
		void queue.process();
	}
}
