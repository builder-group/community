import { describe, expect, it } from 'vitest';
import { BitwiseFlag } from './BitwiseFlag';

export enum TestFlag {
	Flag1 = 1 << 0, // 1
	Flag2 = 1 << 1, // 2
	Flag3 = 1 << 2, // 4
	Flag4 = 1 << 3 // 8
}

describe('BitwiseFlag class', () => {
	it('should initialize with the correct value', () => {
		const manager = new BitwiseFlag<TestFlag>(TestFlag.Flag1);
		expect(manager.has(TestFlag.Flag1)).toBe(true);
		expect(manager.has(TestFlag.Flag2)).toBe(false);
	});

	it('should add flags correctly', () => {
		const manager = new BitwiseFlag<TestFlag>(TestFlag.Flag1);
		manager.add(TestFlag.Flag2);
		expect(manager.has(TestFlag.Flag1)).toBe(true);
		expect(manager.has(TestFlag.Flag2)).toBe(true);
	});

	it('should handle adding the same flag multiple times', () => {
		const manager = new BitwiseFlag<TestFlag>(TestFlag.Flag1);
		manager.add(TestFlag.Flag2);
		manager.add(TestFlag.Flag2);
		expect(manager.has(TestFlag.Flag1)).toBe(true);
		expect(manager.has(TestFlag.Flag2)).toBe(true);
	});

	it('should remove flags correctly', () => {
		const manager = new BitwiseFlag<TestFlag>(TestFlag.Flag1);
		manager.add(TestFlag.Flag2);
		manager.remove(TestFlag.Flag1);
		expect(manager.has(TestFlag.Flag1)).toBe(false);
		expect(manager.has(TestFlag.Flag2)).toBe(true);
	});

	it('should handle removing the same flag multiple times', () => {
		const manager = new BitwiseFlag<TestFlag>(TestFlag.Flag1);
		manager.add(TestFlag.Flag2);
		manager.remove(TestFlag.Flag1);
		manager.remove(TestFlag.Flag1);
		expect(manager.has(TestFlag.Flag1)).toBe(false);
		expect(manager.has(TestFlag.Flag2)).toBe(true);
	});

	it('should reset flags correctly', () => {
		const manager = new BitwiseFlag<TestFlag>(TestFlag.Flag1);
		manager.add(TestFlag.Flag2);
		manager.reset();
		expect(manager.has(TestFlag.Flag1)).toBe(false);
		expect(manager.has(TestFlag.Flag2)).toBe(false);
	});

	it('should handle multiple flags correctly', () => {
		const manager = new BitwiseFlag<TestFlag>(TestFlag.Flag1);
		manager.add(TestFlag.Flag2).add(TestFlag.Flag2).add(TestFlag.Flag3);
		expect(manager.has(TestFlag.Flag1)).toBe(true);
		expect(manager.has(TestFlag.Flag2)).toBe(true);
		expect(manager.has(TestFlag.Flag3)).toBe(true);
		manager.remove(TestFlag.Flag2);
		expect(manager.has(TestFlag.Flag2)).toBe(false);
	});
});
