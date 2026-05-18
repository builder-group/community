import { describe, expect, expectTypeOf, it } from 'vitest';
import { createState } from '../create-state';
import { multiUndoFeature } from './multi-undo';
import { undoFeature } from './undo';

describe('multiUndoFeature function', () => {
	it('should have correct types', () => {
		const state = createState('Jeff').with(undoFeature<string>(), multiUndoFeature<string>());

		expectTypeOf(state.get()).toEqualTypeOf<string>();
		expectTypeOf(state._history).toEqualTypeOf<string[]>();
		expectTypeOf(state.multiUndo).toEqualTypeOf<(count: number) => void>();
	});

	it('should undo multiple state changes', () => {
		// Prepare
		const state = createState(0).with(undoFeature<number>(), multiUndoFeature<number>());

		// Act
		state.set(1);
		state.set(2);
		state.set(3);
		state.multiUndo(2);

		// Assert
		expect(state.get()).toBe(1);
	});
});
