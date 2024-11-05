import { describe, expect, it, vi } from 'vitest';

import { createState } from '../create-state';
import { withSelector } from './with-selector';

describe('withSelector function', () => {
	it('should notify listener when selected path changes', () => {
		// Prepare
		const state = withSelector(createState({ user: { name: 'John', age: 30 } }));
		const callback = vi.fn();

		// Act
		state.listenToSelected(['user.name'], callback);
		state.set({ user: { name: 'Jane', age: 30 } });

		// Assert
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('should not notify listener when unrelated path changes', () => {
		// Prepare
		const state = withSelector(createState({ user: { name: 'John', age: 30 } }));
		const callback = vi.fn();

		// Act
		state.listenToSelected(['user.name'], callback);
		state.set({ user: { name: 'John', age: 31 } });

		// Assert
		expect(callback).not.toHaveBeenCalled();
	});

	it('should notify listener when any of multiple selected paths change', () => {
		// Prepare
		const state = withSelector(createState({ user: { name: 'John', age: 30 } }));
		const callback = vi.fn();

		// Act
		state.listenToSelected(['user.name', 'user.age'], callback);
		state.set({ user: { name: 'John', age: 31 } });

		// Assert
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('should notify listener when parent of selected path changes', () => {
		// Prepare
		const state = withSelector(createState({ user: { name: 'John', age: 30 } }));
		const callback = vi.fn();

		// Act
		state.listenToSelected(['user.name'], callback);
		state._v = { user: { name: 'Jane', age: 31 } };
		state._notify({ additionalData: { changedProperties: ['user.name'] } });

		// Assert
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('should work with function-based selectors', () => {
		// Prepare
		const state = withSelector(createState({ count: 0 }));
		const callback = vi.fn();

		// Act
		state.listenToSelected((value) => value.count % 2, callback);
		state.set({ count: 1 });
		state.set({ count: 2 });

		// Assert
		expect(callback).toHaveBeenCalledTimes(2);
	});

	it('should notify listener when prevValue is null', () => {
		// Prepare
		const state = withSelector(createState(null));
		const callback = vi.fn();

		// Act
		state.listenToSelected(['user.name'] as any, callback);
		state.set({ user: { name: 'John' } } as any);

		// Assert
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('should notify listener when changedProperties is null', () => {
		// Prepare
		const state = withSelector(createState({ user: { name: 'John' } }));
		const callback = vi.fn();

		// Act
		state.listenToSelected(['user.name'], callback);
		state._v = { user: { name: 'Jane' } };
		state._notify({ additionalData: { changedProperties: null as any } });

		// Assert
		expect(callback).toHaveBeenCalledTimes(1);
	});
});
