import { beforeEach, describe, expect, it } from 'vitest';
import {
	createListenerQueue,
	getListenerQueue,
	listenerQueues,
	processListenerQueue
} from './listener-queue';

describe('listener-queue', () => {
	beforeEach(() => {
		listenerQueues.clear();
	});

	describe('createListenerQueue', () => {
		it('should register a queue by key', () => {
			// Act
			const queue = createListenerQueue('test');

			// Assert
			expect(getListenerQueue('test')).toBe(queue);
		});

		it('should replace an existing queue for the same key', () => {
			// Prepare
			const firstQueue = createListenerQueue('test');

			// Act
			const secondQueue = createListenerQueue('test', { async: true });

			// Assert
			expect(secondQueue).not.toBe(firstQueue);
			expect(getListenerQueue('test')).toBe(secondQueue);
			expect(listenerQueues.size).toBe(1);
		});
	});

	describe('getListenerQueue', () => {
		it('should return undefined for an unknown queue', () => {
			// Act
			const result = getListenerQueue('missing');

			// Assert
			expect(result).toBeUndefined();
		});
	});

	describe('processListenerQueue', () => {
		it('should process queued callbacks by priority', async () => {
			// Prepare
			const queue = createListenerQueue('test');
			const calls: string[] = [];
			queue.push(
				{
					callback: () => {
						calls.push('late');
					},
					context: { value: null }
				},
				2
			);
			queue.push(
				{
					callback: () => {
						calls.push('early');
					},
					context: { value: null }
				},
				1
			);

			// Act
			await processListenerQueue('test');

			// Assert
			expect(calls).toEqual(['early', 'late']);
			expect(queue.length).toBe(0);
		});

		it('should await an async queue', async () => {
			// Prepare
			const queue = createListenerQueue('test', { async: true });
			const calls: string[] = [];
			queue.push(
				{
					callback: async () => {
						await Promise.resolve();
						calls.push('done');
					},
					context: { value: 1 }
				},
				0
			);

			// Act
			await processListenerQueue('test');

			// Assert
			expect(calls).toEqual(['done']);
			expect(queue.length).toBe(0);
		});

		it('should ignore an unknown queue', () => {
			// Act + Assert
			expect(processListenerQueue('missing')).toBeUndefined();
		});
	});
});
