import { describe, expect, it } from 'vitest';
import {
	AsyncListenerQueue,
	EListenerQueuePriority,
	SyncListenerQueue,
	SyncPriorityListenerQueue,
	type TListenerQueueItem
} from './ListenerQueue';

describe('SyncListenerQueue', () => {
	describe('process', () => {
		it('should process queued callbacks in insertion order', () => {
			// Prepare
			const queue = new SyncListenerQueue();
			const calls: string[] = [];
			queue.push(
				createListenerQueueItem(() => {
					calls.push('first');
				})
			);
			queue.push(
				createListenerQueueItem(() => {
					calls.push('second');
				})
			);

			// Act
			queue.process();

			// Assert
			expect(calls).toEqual(['first', 'second']);
			expect(queue.length).toBe(0);
		});

		it('should skip removed queued callbacks', () => {
			// Prepare
			const queue = new SyncListenerQueue();
			const calls: string[] = [];
			const removedItem = createListenerQueueItem(() => {
				calls.push('removed');
			});
			queue.push(
				createListenerQueueItem(() => {
					calls.push('kept');
				})
			);
			queue.push(removedItem);

			// Act
			const removedCount = queue.removeWhere((item) => item === removedItem);
			queue.process();

			// Assert
			expect(removedCount).toBe(1);
			expect(calls).toEqual(['kept']);
			expect(queue.length).toBe(0);
		});
	});
});

describe('AsyncListenerQueue', () => {
	describe('process', () => {
		it('should await queued callbacks in insertion order', async () => {
			// Prepare
			const queue = new AsyncListenerQueue();
			const calls: string[] = [];
			queue.push(
				createListenerQueueItem(async () => {
					await Promise.resolve();
					calls.push('first');
				})
			);
			queue.push(
				createListenerQueueItem(() => {
					calls.push('second');
				})
			);

			// Act
			const processPromise = queue.process();

			// Assert
			expect(calls).toEqual([]);

			// Act
			await processPromise;

			// Assert
			expect(calls).toEqual(['first', 'second']);
			expect(queue.length).toBe(0);
		});

		it('should reuse the active process for overlapping calls', async () => {
			// Prepare
			const queue = new AsyncListenerQueue();
			const calls: string[] = [];
			const firstCallback = createDeferred();
			queue.push(
				createListenerQueueItem(async () => {
					await firstCallback.promise;
					calls.push('first');
				})
			);

			// Act
			const firstProcessPromise = queue.process();
			queue.push(
				createListenerQueueItem(() => {
					calls.push('second');
				})
			);
			const secondProcessPromise = queue.process();

			// Assert
			expect(secondProcessPromise).toBe(firstProcessPromise);
			expect(calls).toEqual([]);

			// Act
			firstCallback.resolve();
			await secondProcessPromise;

			// Assert
			expect(calls).toEqual(['first', 'second']);
			expect(queue.length).toBe(0);
		});
	});
});

describe('SyncPriorityListenerQueue', () => {
	describe('process', () => {
		it('should process queued callbacks by priority', () => {
			// Prepare
			const queue = new SyncPriorityListenerQueue();
			const calls: string[] = [];
			queue.push(
				createListenerQueueItem(() => {
					calls.push('late');
				}),
				{
					priority: EListenerQueuePriority.LATE
				}
			);
			queue.push(
				createListenerQueueItem(() => {
					calls.push('early');
				}),
				{
					priority: EListenerQueuePriority.EARLY
				}
			);

			// Act
			queue.process();

			// Assert
			expect(calls).toEqual(['early', 'late']);
			expect(queue.length).toBe(0);
		});

		it('should use default priority when priority is not provided', () => {
			// Prepare
			const queue = new SyncPriorityListenerQueue();
			const calls: string[] = [];
			queue.push(
				createListenerQueueItem(() => {
					calls.push('late');
				}),
				{
					priority: EListenerQueuePriority.LATE
				}
			);
			queue.push(
				createListenerQueueItem(() => {
					calls.push('default');
				}),
				{}
			);
			queue.push(
				createListenerQueueItem(() => {
					calls.push('early');
				}),
				{
					priority: EListenerQueuePriority.EARLY
				}
			);

			// Act
			queue.process();

			// Assert
			expect(calls).toEqual(['early', 'default', 'late']);
			expect(queue.length).toBe(0);
		});
	});
});

function createListenerQueueItem(callback: TListenerQueueItem['callback']): TListenerQueueItem {
	return {
		callback,
		context: { value: null }
	};
}

function createDeferred(): TDeferred {
	let resolvePromise: (() => void) | null = null;
	const promise = new Promise<void>((resolve) => {
		resolvePromise = resolve;
	});

	if (resolvePromise == null) {
		throw new Error('Deferred promise resolver was not initialized.');
	}

	return {
		promise,
		resolve: resolvePromise
	};
}

interface TDeferred {
	promise: Promise<void>;
	resolve(): void;
}
