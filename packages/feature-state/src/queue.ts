import { ListenerQueue } from './ListenerQueue';

const GLOBAL_STATE_QUEUES = new Map<string, ListenerQueue>();

// Initialize default queues
GLOBAL_STATE_QUEUES.set('async', new ListenerQueue(false));
GLOBAL_STATE_QUEUES.set('sync', new ListenerQueue(true));

export function createQueue(name: string, options: { sync: boolean }): void {
	GLOBAL_STATE_QUEUES.set(name, new ListenerQueue(options.sync));
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
