import { ListenerQueue } from './ListenerQueue';

export const GLOBAL_STATE_QUEUES = new Map<string, ListenerQueue>();

export function createQueue(name: string, options: { sync: boolean }): ListenerQueue {
	const queue = new ListenerQueue(options.sync);
	GLOBAL_STATE_QUEUES.set(name, queue);
	return queue;
}

export function getQueue(name: string): ListenerQueue | undefined {
	return GLOBAL_STATE_QUEUES.get(name);
}

export function processQueue(name: string): void {
	const queue = GLOBAL_STATE_QUEUES.get(name);
	if (queue != null) {
		void queue.process();
	}
}

export function processAllQueues(): void {
	for (const [_, queue] of GLOBAL_STATE_QUEUES) {
		void queue.process();
	}
}
