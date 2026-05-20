import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { createState, setSourceKey } from './create-state';
import { multiUndoFeature, undoFeature } from './features';

describe('createState function', () => {
	describe('types', () => {
		it('should infer value and feature types', () => {
			// Act
			const state = createState('Jeff').with(undoFeature<string>(), multiUndoFeature<string>());

			// Assert
			expectTypeOf(state.get()).toEqualTypeOf<string>();
			expectTypeOf(state._v).toEqualTypeOf<string>();
			expectTypeOf(state.value).toEqualTypeOf<string>();
			expectTypeOf(state._history).toEqualTypeOf<string[]>();
			expectTypeOf(state.multiUndo).toEqualTypeOf<(count: number) => void>();
		});
	});

	describe('value property', () => {
		it('should initialize with the provided value', () => {
			// Prepare
			const initialValue = { count: 0 };

			// Act
			const state = createState(initialValue);

			// Assert
			expect(state.get()).toBe(initialValue);
			expect(state._v).toBe(initialValue);
			expect(state.value).toBe(initialValue);
		});

		it('should update through the value setter', () => {
			// Prepare
			const state = createState(10);
			const listener = vi.fn();
			state.listen(listener);

			// Act
			state.value = 20;

			// Assert
			expect(state.get()).toBe(20);
			expect(listener).toHaveBeenCalledWith({
				source: setSourceKey,
				value: 20,
				prevValue: 10
			});
		});

		it('should expose the same object through the backing value and value getter', () => {
			// Prepare
			const state = createState({ count: 0 });

			// Act
			state.value.count = 1;

			// Assert
			expect(state._v.count).toBe(1);
			expect(state.get().count).toBe(1);
		});
	});

	describe('set method', () => {
		it('should update with a direct value', () => {
			// Prepare
			const state = createState(10);

			// Act
			state.set(20);

			// Assert
			expect(state.get()).toBe(20);
		});

		it('should update with an updater function', () => {
			// Prepare
			const state = createState(10);

			// Act
			state.set((value) => value + 10);

			// Assert
			expect(state.get()).toBe(20);
		});

		it('should not notify listeners when the value is unchanged', () => {
			// Prepare
			const state = createState(10);
			const listener = vi.fn();
			state.listen(listener);

			// Act
			state.set(10);

			// Assert
			expect(listener).not.toHaveBeenCalled();
		});

		it('should compare changes with Object.is', () => {
			// Prepare
			const state = createState(Number.NaN);
			const listener = vi.fn();
			state.listen(listener);

			// Act
			state.set(Number.NaN);

			// Assert
			expect(listener).not.toHaveBeenCalled();
		});
	});

	describe('notify method', () => {
		it('should notify listeners with the current value', () => {
			// Prepare
			const state = createState(10);
			const listener = vi.fn();
			state.listen(listener);

			// Act
			state.notify({ listenerContext: { source: 'manual' } });

			// Assert
			expect(listener).toHaveBeenCalledWith({
				source: 'manual',
				value: 10,
				prevValue: undefined
			});
		});

		it('should support manual notification after mutating value in place', () => {
			// Prepare
			const state = createState({ count: 0 });
			const prevValue = { count: state.value.count };
			const listener = vi.fn();
			state.listen(listener);

			// Act
			state.value.count = 1;
			state.notify({ listenerContext: { source: 'manual' }, prevValue });

			// Assert
			expect(listener).toHaveBeenCalledWith({
				source: 'manual',
				value: { count: 1 },
				prevValue
			});
		});
	});

	describe('listen method', () => {
		it('should call listeners when the value changes', () => {
			// Prepare
			const state = createState(10);
			const listener = vi.fn();
			state.listen(listener);

			// Act
			state.set(20);

			// Assert
			expect(listener).toHaveBeenCalledWith({
				source: setSourceKey,
				value: 20,
				prevValue: 10
			});
		});

		it('should call listeners in registration order by default', () => {
			// Prepare
			const state = createState(10);
			const calls: string[] = [];
			state.listen(() => {
				calls.push('first');
			});
			state.listen(() => {
				calls.push('second');
			});

			// Act
			state.set(20);

			// Assert
			expect(calls).toEqual(['first', 'second']);
		});

		it('should remove a listener with the returned unbind function', () => {
			// Prepare
			const state = createState(10);
			const listener = vi.fn();
			const unbind = state.listen(listener);

			// Act
			unbind();
			state.set(20);

			// Assert
			expect(listener).not.toHaveBeenCalled();
		});

		it('should remove queued listener calls by callback when unbound during notification', () => {
			// Prepare
			const state = createState(10);
			let unbindSecond = () => {};
			const listener = vi.fn();
			state.listen(() => {
				unbindSecond();
			});
			unbindSecond = state.listen(listener);

			// Act
			state.set(20);

			// Assert
			expect(listener).not.toHaveBeenCalled();
		});
	});

	describe('subscribe method', () => {
		it('should call listeners immediately with the current value', () => {
			// Prepare
			const state = createState(10);
			const listener = vi.fn();

			// Act
			state.subscribe(listener);

			// Assert
			expect(listener).toHaveBeenCalledWith({ value: 10, prevValue: 10 });
		});
	});

	describe('features', () => {
		it('should compose features with the feature-core chain', () => {
			// Prepare
			const state = createState(0).with(undoFeature<number>(), multiUndoFeature<number>());

			// Act
			state.set(1);
			state.multiUndo(1);

			// Assert
			expectTypeOf(state._history).toEqualTypeOf<number[]>();
			expect(state.get()).toBe(0);
			expect(state._history).toStrictEqual([0]);
		});
	});
});
