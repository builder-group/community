import { describe, expect, it } from 'vitest';
import { FifoQueue } from './FifoQueue';

describe('FifoQueue', () => {
	describe('pop', () => {
		it('should return null when the queue is empty', () => {
			// Prepare
			const queue = new FifoQueue<string>();

			// Act
			const item = queue.pop();

			// Assert
			expect(item).toBeNull();
			expect(queue.length).toBe(0);
		});

		it('should pop items in insertion order', () => {
			// Prepare
			const queue = new FifoQueue<string>();
			queue.push('first');
			queue.push('second');

			// Act
			const items = [queue.pop(), queue.pop(), queue.pop()];

			// Assert
			expect(items).toEqual(['first', 'second', null]);
			expect(queue.length).toBe(0);
		});

		it('should support pushing again after it was drained', () => {
			// Prepare
			const queue = new FifoQueue<string>();
			queue.push('first');
			queue.pop();

			// Act
			queue.push('second');
			const items = [queue.pop(), queue.pop()];

			// Assert
			expect(items).toEqual(['second', null]);
			expect(queue.length).toBe(0);
		});
	});

	describe('removeWhere', () => {
		it('should remove queued items matching a predicate', () => {
			// Prepare
			const queue = new FifoQueue<string>();
			queue.push('keep');
			queue.push('remove');
			queue.push('keep');

			// Act
			const removedCount = queue.removeWhere((item) => item === 'remove');

			// Assert
			expect(removedCount).toBe(1);
			expect(queue.length).toBe(2);
			expect(queue.pop()).toBe('keep');
			expect(queue.pop()).toBe('keep');
		});

		it('should remove only pending items after a partial drain', () => {
			// Prepare
			const queue = new FifoQueue<string>();
			queue.push('processed');
			queue.push('remove');
			queue.push('keep');
			queue.pop();

			// Act
			const removedCount = queue.removeWhere((item) => item === 'remove');

			// Assert
			expect(removedCount).toBe(1);
			expect(queue.length).toBe(1);
			expect(queue.pop()).toBe('keep');
			expect(queue.pop()).toBeNull();
		});
	});
});
