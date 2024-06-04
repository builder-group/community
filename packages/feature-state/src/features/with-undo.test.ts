import { describe, expect, it } from 'vitest';

import { createState } from '../create-state';
import { withUndo } from './with-undo';

describe('withUndo function tests', () => {
	it('should have correct types', () => {
		const state = createState('Jeff');
		const stateWithUndo = withUndo(state);
	});

	it('should allow undoing the last set operation', () => {
		// Prepare
		const state = withUndo(createState(10, false));

		// Act
		state.set(20);
		state.undo();

		// Assert
		expect(state.get()).toBe(10);
	});

	it('should handle multiple undos correctly', () => {
		// Prepare
		const state = withUndo(createState('initial', false));

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
		const state = withUndo(createState(10, false));

		// Act
		state.undo();

		// Assert
		expect(state.get()).toBe(10);
	});

	it('should only record distinct consecutive values for undo', () => {
		// Prepare
		const state = withUndo(createState(10, false));

		// Act
		state.set(10); // Same as initial, should not be recorded
		state.set(20);
		state.set(20); // Duplicate, should not be recorded again
		state.undo();

		// Assert
		expect(state.get()).toBe(10);
	});

	it('should respect the history stack size limit', () => {
		// Prepare
		const historyLimit = 5;
		const state = withUndo(createState(0, false), historyLimit);

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
