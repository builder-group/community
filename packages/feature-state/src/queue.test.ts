import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createState } from './create-state';
import {
	createQueue,
	getQueue,
	GLOBAL_STATE_QUEUES,
	processAllQueues,
	processQueue
} from './queue';

describe('Queue system', () => {
	beforeEach(() => {
		// Clear global state for clean reset
		GLOBAL_STATE_QUEUES.clear();
	});

	it('should create, retrieve and handle queues correctly', () => {
		// Create queues
		createQueue('test-sync', { sync: true });
		createQueue('test-async', { sync: false });

		// Direct access to global state
		expect(GLOBAL_STATE_QUEUES.size).toBe(2);
		expect(GLOBAL_STATE_QUEUES.has('test-sync')).toBe(true);
		expect(GLOBAL_STATE_QUEUES.has('test-async')).toBe(true);

		// Retrieve queues
		const syncQueue = getQueue('test-sync');
		const asyncQueue = getQueue('test-async');
		const nonExistent = getQueue('non-existent');

		// Assert
		expect(syncQueue?.sync).toBe(true);
		expect(asyncQueue?.sync).toBe(false);
		expect(nonExistent).toBeUndefined();

		// Override queue
		createQueue('test-sync', { sync: false });
		expect(getQueue('test-sync')?.sync).toBe(false);
		expect(GLOBAL_STATE_QUEUES.size).toBe(2); // Size should remain same
	});

	it('should create states with auto-created queues', () => {
		// States should auto-create default queues
		const defaultState = createState('default');
		const syncState = createState('sync', { queue: 'sync' });
		const customState = createState('custom', { queue: 'my-custom-queue' });

		// Check auto-created queues
		expect(GLOBAL_STATE_QUEUES.has('async')).toBe(true);
		expect(GLOBAL_STATE_QUEUES.has('sync')).toBe(true);
		expect(GLOBAL_STATE_QUEUES.has('my-custom-queue')).toBe(true);

		expect(GLOBAL_STATE_QUEUES.get('async')?.sync).toBe(false);
		expect(GLOBAL_STATE_QUEUES.get('sync')?.sync).toBe(true);
		expect(GLOBAL_STATE_QUEUES.get('my-custom-queue')?.sync).toBe(false); // Custom queues default to async

		// Verify states reference the correct queues
		expect(defaultState._queue).toBe(GLOBAL_STATE_QUEUES.get('async'));
		expect(syncState._queue).toBe(GLOBAL_STATE_QUEUES.get('sync'));
		expect(customState._queue).toBe(GLOBAL_STATE_QUEUES.get('my-custom-queue'));
	});

	it('should handle shared queues and isolation correctly', () => {
		createQueue('shared', { sync: true });

		const state1 = createState(0, { queue: 'shared' });
		const state2 = createState(0, { queue: 'shared' });
		const isolatedState = createState(0, { queue: 'sync' });

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
		const syncState = createState(0, { queue: 'sync' });
		const asyncState = createState(0, { queue: 'async' });
		const syncListener = vi.fn();
		const asyncListener = vi.fn();

		syncState.listen((context) => {
			syncListener(context);
		});
		asyncState.listen(async (context) => {
			await new Promise((resolve) => setTimeout(resolve, 10));
			asyncListener(context);
		});

		// Act
		syncState.set(1);
		asyncState.set(2);

		// Sync should be immediate
		expect(syncListener).toHaveBeenCalledWith({
			source: 'state_set',
			value: 1,
			prevValue: 0
		});

		// Async should be deferred to next microtask
		expect(asyncListener).not.toHaveBeenCalled();

		// Wait for async processing to complete
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(asyncListener).toHaveBeenCalledWith({
			source: 'state_set',
			value: 2,
			prevValue: 0
		});
	});

	it('should handle manual processing and queue inspection', () => {
		const state = createState(0, { queue: 'sync' });
		const listener = vi.fn();
		state.listen(listener);

		// Disable auto-processing
		state.set(1, { processListenerQueue: false });

		// Queue should have items
		expect(GLOBAL_STATE_QUEUES.get('sync')?.length).toBe(1);
		expect(listener).not.toHaveBeenCalled();

		// Manual processing
		processQueue('sync');
		expect(GLOBAL_STATE_QUEUES.get('sync')?.length).toBe(0);
		expect(listener).toHaveBeenCalled();

		// Test processAllQueues
		createQueue('test-queue', { sync: true });
		const testState = createState(0, { queue: 'test-queue' });
		const testListener = vi.fn();
		testState.listen(testListener);

		state.set(2, { processListenerQueue: false });
		testState.set(3, { processListenerQueue: false });

		processAllQueues();

		expect(listener).toHaveBeenCalledTimes(2);
		expect(testListener).toHaveBeenCalled();

		// Test non-existent queue handling
		expect(() => processQueue('non-existent')).not.toThrow();
	});
});
