import { describe, expect, it } from 'vitest';
import { FlatQueue } from './FlatQueue';

describe('FlatQueue', () => {
	describe('pop', () => {
		it('should return null when the queue is empty', () => {
			// Prepare
			const queue = new FlatQueue<string>();

			// Act
			const item = queue.pop();

			// Assert
			expect(item).toBe(null);
		});

		it('should pop items from lowest priority to highest priority', () => {
			// Prepare
			const queue = new FlatQueue<string>();
			queue.push('a', 4);
			queue.push('b', 3);
			queue.push('c', 1);
			queue.push('d', 2);
			queue.push('e', 5);

			// Act
			const items = [queue.pop(), queue.pop(), queue.pop(), queue.pop(), queue.pop()];

			// Assert
			expect(items).toEqual(['c', 'd', 'b', 'a', 'e']);
			expect(queue.length).toBe(0);
		});

		it('should preserve insertion order for equal priorities', () => {
			// Prepare
			const queue = new FlatQueue<string>();
			queue.push('first', 1);
			queue.push('second', 1);
			queue.push('third', 1);

			// Act
			const items = [queue.pop(), queue.pop(), queue.pop()];

			// Assert
			expect(items).toEqual(['first', 'second', 'third']);
		});

		it('should support pushing again after it was drained', () => {
			// Prepare
			const queue = new FlatQueue<string>();
			queue.push('a', 2);
			queue.push('b', 1);
			queue.pop();
			queue.pop();

			// Act
			queue.push('c', 2);
			queue.push('d', 1);
			const items = [queue.pop(), queue.pop(), queue.pop()];

			// Assert
			expect(items).toEqual(['d', 'c', null]);
			expect(queue.length).toBe(0);
		});
	});

	describe('removeWhere', () => {
		it('should remove matching queued items', () => {
			// Prepare
			const queue = new FlatQueue<string>();
			queue.push('a', 4);
			queue.push('b', 3);
			queue.push('c', 1);
			queue.push('d', 2);

			// Act
			const removedCount = queue.removeWhere((item) => item === 'b' || item === 'd');

			// Assert
			expect(removedCount).toBe(2);
			expect(queue.length).toBe(2);
			expect([queue.pop(), queue.pop(), queue.pop()]).toEqual(['c', 'a', null]);
		});

		it('should preserve the queue when no item matches', () => {
			// Prepare
			const queue = new FlatQueue<string>();
			queue.push('a', 2);
			queue.push('b', 1);

			// Act
			const removedCount = queue.removeWhere((item) => item === 'c');

			// Assert
			expect(removedCount).toBe(0);
			expect(queue.length).toBe(2);
			expect([queue.pop(), queue.pop()]).toEqual(['b', 'a']);
		});

		it('should restore heap order after removing the current root', () => {
			// Prepare
			const queue = new FlatQueue<string>();
			queue.push('a', 5);
			queue.push('b', 1);
			queue.push('c', 4);
			queue.push('d', 2);
			queue.push('e', 3);

			// Act
			const removedCount = queue.removeWhere((item) => item === 'b' || item === 'd');

			// Assert
			expect(removedCount).toBe(2);
			expect(queue.length).toBe(3);
			expect([queue.pop(), queue.pop(), queue.pop(), queue.pop()]).toEqual(['e', 'c', 'a', null]);
		});
	});

	describe('clear', () => {
		it('should remove all queued items', () => {
			// Prepare
			const queue = new FlatQueue<string>();
			queue.push('a', 2);
			queue.push('b', 1);

			// Act
			queue.clear();

			// Assert
			expect(queue.length).toBe(0);
			expect(queue.pop()).toBe(null);
		});
	});
});
