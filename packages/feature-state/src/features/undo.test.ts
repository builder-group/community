import { describe, expect, expectTypeOf, it } from 'vitest';
import { createState } from '../create-state';
import { undoFeature } from './undo';

describe('undoFeature function', () => {
	it('should have correct types', () => {
		const state = createState('Jeff').with(undoFeature<string>());

		expectTypeOf(state.get()).toEqualTypeOf<string>();
		expectTypeOf(state._history).toEqualTypeOf<string[]>();
	});

	it('should allow undoing the last set operation', () => {
		// Prepare
		const state = createState(10).with(undoFeature<number>());

		// Act
		state.set(20);
		state.undo();

		// Assert
		expect(state.get()).toBe(10);
	});

	it('should handle multiple undos correctly', () => {
		// Prepare
		const state = createState('initial').with(undoFeature<string>());

		// Act
		state.set('first');
		state.set('second');
		state.undo();
		state.undo();

		// Assert
		expect(state.get()).toBe('initial');
	});

	it('should do nothing if there is nothing to undo', () => {
		// Prepare
		const state = createState(10).with(undoFeature<number>());

		// Act
		state.undo();

		// Assert
		expect(state.get()).toBe(10);
	});

	it('should only record distinct consecutive values for undo', () => {
		// Prepare
		const state = createState(10).with(undoFeature<number>());

		// Act
		state.set(10);
		state.set(20);
		state.set(20);
		state.undo();

		// Assert
		expect(state.get()).toBe(10);
	});

	it('should respect the history stack size limit', () => {
		// Prepare
		const historyLimit = 5;
		const state = createState(0).with(undoFeature<number>(historyLimit));

		// Act
		for (let i = 1; i <= 10; i++) {
			state.set(i);
		}
		for (let i = 0; i < historyLimit; i++) {
			state.undo();
		}

		// Assert
		expect(state.get()).toBe(6);
	});
});
