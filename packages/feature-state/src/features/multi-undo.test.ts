import { describe, expect, expectTypeOf, it } from 'vitest';
import { createState } from '../create-state';
import { multiUndoFeature } from './multi-undo';
import { undoFeature } from './undo';

describe('multiUndoFeature function', () => {
	describe('types', () => {
		it('should infer multi-undo feature APIs', () => {
			const state = createState('Jeff').with(undoFeature<string>(), multiUndoFeature<string>());

			expectTypeOf(state.get()).toEqualTypeOf<string>();
			expectTypeOf(state._history).toEqualTypeOf<string[]>();
			expectTypeOf(state.multiUndo).toEqualTypeOf<(count: number) => void>();
		});
	});

	describe('multiUndo method', () => {
		it('should restore multiple previous values', () => {
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
});
