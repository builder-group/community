import { describe, expect, it } from 'vitest';
import { FlatQueue } from './FlatQueue';

describe('FlatQueue class', () => {
	it('should maintain a priority queue', () => {
		const queue = new FlatQueue<string>();
		queue.push('a', 4);
		queue.push('b', 3);
		queue.push('c', 1);
		queue.push('d', 2);
		queue.push('e', 5);

		expect(queue.pop()).toBe('c');
		expect(queue.pop()).toBe('d');
		expect(queue.pop()).toBe('b');
		expect(queue.pop()).toBe('a');
		expect(queue.pop()).toBe('e');
	});

	it('should handle edge cases', () => {
		const queue = new FlatQueue<string>();

		queue.push('a', 2);
		queue.push('b', 1);
		expect(queue.pop()).toBe('b');
		expect(queue.pop()).toBe('a');
		expect(queue.pop()).toBe(null);
		queue.push('c', 2);
		queue.push('d', 1);
		expect(queue.pop()).toBe('d');
		expect(queue.pop()).toBe('c');
		expect(queue.pop()).toBe(null);
	});
});
