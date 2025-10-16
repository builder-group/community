import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createState, EStateListenerQueuePriority } from './create-state';
import {
	AsyncListenerQueue,
	createListenerQueue,
	getListenerQueue,
	GLOBAL_LISTENER_QUEUES,
	processAllListenerQueues,
	processListenerQueue,
	SyncListenerQueue
} from './listener-queue';

describe('Listener queue', () => {
	beforeEach(() => {
		GLOBAL_LISTENER_QUEUES.clear();
	});

	it('should create, retrieve and handle queues correctly', () => {
		// Create queues
		createListenerQueue('test-sync', { async: false });
		createListenerQueue('test-async', { async: true });

		// Direct access to global state
		expect(GLOBAL_LISTENER_QUEUES.size).toBe(2);
		expect(GLOBAL_LISTENER_QUEUES.has('test-sync')).toBe(true);
		expect(GLOBAL_LISTENER_QUEUES.has('test-async')).toBe(true);

		// Retrieve queues
		const syncQueue = getListenerQueue('test-sync');
		const asyncQueue = getListenerQueue('test-async');
		const nonExistent = getListenerQueue('non-existent');

		// Assert
		expect(syncQueue instanceof SyncListenerQueue).toBe(true);
		expect(asyncQueue instanceof AsyncListenerQueue).toBe(true);
		expect(nonExistent).toBeUndefined();

		// Override queue
		createListenerQueue('test-sync', { async: true });
		expect(getListenerQueue('test-sync') instanceof AsyncListenerQueue).toBe(true);
		expect(GLOBAL_LISTENER_QUEUES.size).toBe(2); // Size should remain same
	});

	it('should create states with auto-created queues', () => {
		// States should auto-create default queues
		const defaultState = createState('default');
		const customState = createState('custom', { queue: 'my-custom-queue' });
		const syncState = createState('sync', { queue: { key: 'sync', async: false } });
		const asyncState = createState('async', { queue: { key: 'async', async: true } });

		// Check auto-created queues
		expect(GLOBAL_LISTENER_QUEUES.has('sync')).toBe(true);
		expect(GLOBAL_LISTENER_QUEUES.has('async')).toBe(true);
		expect(GLOBAL_LISTENER_QUEUES.has('my-custom-queue')).toBe(true);

		expect(GLOBAL_LISTENER_QUEUES.get('sync') instanceof SyncListenerQueue).toBe(true);
		expect(GLOBAL_LISTENER_QUEUES.get('async') instanceof AsyncListenerQueue).toBe(true);
		expect(GLOBAL_LISTENER_QUEUES.get('my-custom-queue') instanceof SyncListenerQueue).toBe(true);

		// Verify states reference the correct queues
		expect(defaultState._queue).toBe(GLOBAL_LISTENER_QUEUES.get('sync'));
		expect(syncState._queue).toBe(GLOBAL_LISTENER_QUEUES.get('sync'));
		expect(asyncState._queue).toBe(GLOBAL_LISTENER_QUEUES.get('async'));
		expect(customState._queue).toBe(GLOBAL_LISTENER_QUEUES.get('my-custom-queue'));
	});

	it('should handle shared queues and isolation correctly', () => {
		createListenerQueue('shared', { async: false });

		const state1 = createState(0, { queue: { key: 'shared' } });
		const state2 = createState(0, { queue: { key: 'shared' } });
		const isolatedState = createState(0, { queue: { key: 'sync' } });

		// Verify queue sharing
		expect(state1._queue).toBe(state2._queue);
		expect(state1._queue).not.toBe(isolatedState._queue);

		// Test isolation
		const listener1 = vi.fn();
		const listener2 = vi.fn();
		const isolatedListener = vi.fn();

		state1.listen(listener1);
		state2.listen(listener2);
		isolatedState.listen(isolatedListener);

		state1.set(1);
		expect(listener1).toHaveBeenCalled();
		expect(listener2).not.toHaveBeenCalled();
		expect(isolatedListener).not.toHaveBeenCalled();
	});

	it('should process sync immediately and async in next tick', async () => {
		const syncState = createState(0, { queue: { key: 'sync', async: false } });
		const asyncState = createState(0, { queue: { key: 'async', async: true } });
		const syncListener = vi.fn();
		const asyncListener = vi.fn();

		syncState.listen(
			async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
			},
			{ priority: EStateListenerQueuePriority.EARLY }
		);
		syncState.listen(
			(context) => {
				syncListener(context);
			},
			{ priority: EStateListenerQueuePriority.DEFAULT }
		);
		asyncState.listen(
			async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
			},
			{ priority: EStateListenerQueuePriority.EARLY }
		);
		asyncState.listen(
			(context) => {
				asyncListener(context);
			},
			{ priority: EStateListenerQueuePriority.LATE }
		);

		// Act
		syncState.set(1);
		asyncState.set(2);

		// Sync should be immediate and not await promise in earlier listeners
		expect(syncListener).toHaveBeenCalledWith({
			source: 'state_set',
			value: 1,
			prevValue: 0
		});

		// Async should be deferred and await promise in earlier listeners
		expect(asyncListener).not.toHaveBeenCalled();

		// Wait for async processing to complete
		await new Promise((resolve) => setTimeout(resolve, 15));
		expect(asyncListener).toHaveBeenCalledWith({
			source: 'state_set',
			value: 2,
			prevValue: 0
		});
	});

	it('should handle manual processing and queue inspection', () => {
		const state = createState(0, { queue: { key: 'sync' } });
		const listener = vi.fn();
		state.listen(listener);

		// Disable auto-processing
		state.set(1, { processListenerQueue: false });

		// Queue should have items
		expect(GLOBAL_LISTENER_QUEUES.get('sync')?.length).toBe(1);
		expect(listener).not.toHaveBeenCalled();

		// Manual processing
		processListenerQueue('sync');
		expect(GLOBAL_LISTENER_QUEUES.get('sync')?.length).toBe(0);
		expect(listener).toHaveBeenCalled();

		// Test processAllQueues
		createListenerQueue('test-queue', { async: false });
		const testState = createState(0, { queue: { key: 'test-queue' } });
		const testListener = vi.fn();
		testState.listen(testListener);

		state.set(2, { processListenerQueue: false });
		testState.set(3, { processListenerQueue: false });

		processAllListenerQueues();

		expect(listener).toHaveBeenCalledTimes(2);
		expect(testListener).toHaveBeenCalled();

		// Test non-existent queue handling
		expect(() => processListenerQueue('non-existent')).not.toThrow();
	});
});
