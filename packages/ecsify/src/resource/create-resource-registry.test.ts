import { describe, expect, it } from 'vitest';
import { createResourceRegistry } from './create-resource-registry';

describe('createResourceRegistry', () => {
	it('registers resources as added and changed', () => {
		const registry = createResourceRegistry<{ inputState: { jump: boolean } }>();

		expect(registry.register('inputState')).toBe(true);
		expect(registry.has('inputState')).toBe(true);
		expect(registry.wasAdded('inputState')).toBe(true);
		expect(registry.wasChanged('inputState')).toBe(true);
	});

	it('does not re-register existing resources', () => {
		const registry = createResourceRegistry<{ score: number }>();

		expect(registry.register('score')).toBe(true);
		expect(registry.register('score')).toBe(false);
	});

	it('supports silent registration without add/change tracking', () => {
		const registry = createResourceRegistry<{ score: number }>();

		expect(registry.register('score', { trackAdded: false, trackChanged: false })).toBe(true);
		expect(registry.has('score')).toBe(true);
		expect(registry.wasAdded('score')).toBe(false);
		expect(registry.wasChanged('score')).toBe(false);
	});

	it('tracks explicit changes for registered resources', () => {
		const registry = createResourceRegistry<{ score: number }>();
		registry.register('score');
		registry.flush();

		expect(registry.wasChanged('score')).toBe(false);
		expect(registry.markChanged('score')).toBe(true);
		expect(registry.wasChanged('score')).toBe(true);
	});

	it('ignores change marks for unknown resources', () => {
		const registry = createResourceRegistry<{ score: number }>();

		expect(registry.markChanged('score')).toBe(false);
	});

	it('clears frame state on flush and all state on reset', () => {
		const registry = createResourceRegistry<{ score: number }>();
		registry.register('score');

		registry.flush();

		expect(registry.wasAdded('score')).toBe(false);
		expect(registry.wasChanged('score')).toBe(false);
		expect(registry.has('score')).toBe(true);

		registry.reset();

		expect(registry.has('score')).toBe(false);
		expect(registry.wasAdded('score')).toBe(false);
		expect(registry.wasChanged('score')).toBe(false);
	});
});
