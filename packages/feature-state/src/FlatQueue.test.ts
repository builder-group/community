import { describe, expect, it } from 'vitest';
import { FlatQueue } from './FlatQueue';

describe('FlatQueue class', () => {
	it('should maintain a priority queue', () => {
		// Prepare
		const priorities: number[] = [];
		for (let i = 0; i < 100; i++) {
			priorities.push(Math.floor(100 * Math.random()));
		}
		const sortedPriorities = priorities.slice().sort((a, b) => a - b);
		const queue = new FlatQueue<number>();

		// Act
		for (let i = 0; i < priorities.length; i++) {
			queue.push(i, priorities[i] as number);
		}

		// Assert
		const resultPriorities: number[] = [];
		while (queue.length) {
			const poppedIndex = queue.pop();
			if (poppedIndex !== null) {
				resultPriorities.push(priorities[poppedIndex] as number);
			}
		}

		expect(resultPriorities).toEqual(sortedPriorities);
	});

	it('should handle edge cases', () => {
		// Prepare
		const queue = new FlatQueue<number>();

		// Act & Assert
		queue.push(0, 2);
		queue.push(1, 1);
		expect(queue.pop()).toBe(1);
		expect(queue.pop()).toBe(0);
		expect(queue.pop()).toBe(null);
		queue.push(2, 2);
		queue.push(3, 1);
		expect(queue.pop()).toBe(3);
		expect(queue.pop()).toBe(2);
		expect(queue.pop()).toBe(null);
		expect(queue.peek()).toBe(null);
		expect(queue.peekValue()).toBe(null);
	});

	it('should shrink internal arrays when calling shrink', () => {
		// Prepare
		const queue = new FlatQueue<number>();

		// Act
		for (let i = 0; i < 10; i++) {
			queue.push(i, i);
		}

		while (queue.length) {
			queue.pop();
		}

		// Assert
		expect(queue.length).toBe(0);

		// Access private properties for testing
		const queueAny = queue as any;
		expect(queueAny.ids.length).toBe(10);
		expect(queueAny.values.length).toBe(10);

		queue.shrink();

		expect(queueAny.ids.length).toBe(0);
		expect(queueAny.values.length).toBe(0);
	});

	it('should initialize with empty queue', () => {
		// Prepare & Act
		const queue = new FlatQueue<string>();

		// Assert
		expect(queue.length).toBe(0);
		expect(queue.peek()).toBe(null);
		expect(queue.peekValue()).toBe(null);
	});

	it('should maintain correct order with same priorities', () => {
		// Prepare
		const queue = new FlatQueue<string>();

		// Act
		queue.push('a', 5); // Item 'a' with priority 5
		queue.push('b', 5); // Item 'b' with priority 5
		queue.push('c', 5); // Item 'c' with priority 5
		queue.push('d', 3); // Item 'd' with priority 3 (lower priority, should come out first)
		queue.push('e', 10); // Item 'e' with priority 10 (higher priority, should come out last)

		// Assert
		expect(queue.pop()).toBe('d'); // Priority 3 (lowest)
		expect(queue.pop()).toBe('a'); // Priority 5 (first in)
		expect(queue.pop()).toBe('b'); // Priority 5 (second in)
		expect(queue.pop()).toBe('c'); // Priority 5 (third in)
		expect(queue.pop()).toBe('e'); // Priority 10 (highest)
	});

	it('should clear the queue correctly', () => {
		// Prepare
		const queue = new FlatQueue<number>();
		for (let i = 0; i < 10; i++) {
			queue.push(i, i);
		}

		// Act
		queue.clear();

		// Assert
		expect(queue.length).toBe(0);
		expect(queue.peek()).toBe(null);
		expect(queue.peekValue()).toBe(null);

		// The internal arrays should still have their original length
		const queueAny = queue as any;
		expect(queueAny.ids.length).toBe(10);
		expect(queueAny.values.length).toBe(10);
	});
});
