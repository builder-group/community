import { describe, expect, expectTypeOf, it } from 'vitest';
import { createState } from '../create-state';
import { undoFeature } from './undo';

describe('undoFeature function', () => {
	describe('types', () => {
		it('should infer undo feature state types', () => {
			const state = createState('Jeff').with(undoFeature<string>());

			expectTypeOf(state.get()).toEqualTypeOf<string>();
			expectTypeOf(state._history).toEqualTypeOf<string[]>();
		});
	});

	describe('undo method', () => {
		it('should restore the previous value', () => {
			// Prepare
			const state = createState(10).with(undoFeature<number>());

			// Act
			state.set(20);
			state.undo();

			// Assert
			expect(state.get()).toBe(10);
		});

		it('should restore multiple previous values in order', () => {
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

		it('should restore nullish values', () => {
			// Prepare
			const state = createState<number | null | undefined>(undefined).with(
				undoFeature<number | null | undefined>()
			);

			// Act
			state.set(null);
			state.set(1);
			state.undo();
			const nullValue = state.get();
			state.undo();
			const undefinedValue = state.get();

			// Assert
			expect(nullValue).toBe(null);
			expect(undefinedValue).toBe(undefined);
		});

		it('should do nothing when history is empty', () => {
			// Prepare
			const state = createState(10).with(undoFeature<number>());

			// Act
			state.undo();

			// Assert
			expect(state.get()).toBe(10);
		});
	});

	describe('history', () => {
		it('should only record distinct consecutive values', () => {
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

		it('should respect the stack size limit', () => {
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
});
