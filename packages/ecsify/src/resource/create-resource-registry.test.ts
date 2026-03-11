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

	it('fires add and change callbacks for tracked resources', () => {
		const registry = createResourceRegistry<{ score: number }>();
		let added = 0;
		let changed = 0;

		registry.onAdd('score', () => {
			added += 1;
		});
		registry.onChange('score', () => {
			changed += 1;
		});

		registry.register('score');
		registry.flush();
		registry.markChanged('score');

		expect(added).toBe(1);
		expect(changed).toBe(2);
	});

	it('fires change callbacks when registration tracks change without add', () => {
		const registry = createResourceRegistry<{ score: number }>();
		let added = 0;
		let changed = 0;

		registry.onAdd('score', () => {
			added += 1;
		});
		registry.onChange('score', () => {
			changed += 1;
		});

		registry.register('score', { trackAdded: false, trackChanged: true });

		expect(added).toBe(0);
		expect(changed).toBe(1);
	});

	it('fires flush callbacks only for tracked resources with changes', () => {
		const registry = createResourceRegistry<{ score: number; lives: number }>();
		let scoreFlushes = 0;
		let livesFlushes = 0;

		registry.onFlush('score', () => {
			scoreFlushes += 1;
		});
		registry.onFlush('lives', () => {
			livesFlushes += 1;
		});

		registry.register('score');
		registry.flush();
		registry.markChanged('score');
		registry.flush();

		expect(scoreFlushes).toBe(2);
		expect(livesFlushes).toBe(0);
	});

	it('returns unregister functions for callbacks', () => {
		const registry = createResourceRegistry<{ score: number }>();
		let changes = 0;

		const unsubscribe = registry.onChange('score', () => {
			changes += 1;
		});

		registry.register('score', { trackChanged: false });
		registry.markChanged('score');
		unsubscribe();
		registry.flush();
		registry.markChanged('score');

		expect(changes).toBe(1);
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
