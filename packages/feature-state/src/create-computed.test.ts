import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { computedSourceKey, createComputed, type TComputedState } from './create-computed';
import { createState } from './create-state';
import { priorityQueueFeature, undoFeature } from './features';

describe('createComputed function', () => {
	describe('types', () => {
		it('should infer value and source types', () => {
			// Act
			const $a = createState(2);
			const $b = createState('hello');
			const $computed = createComputed([$a, $b] as const, ([a, b]) => `${b}:${a}`);
			const $doubled = createComputed(createState(2).with(undoFeature<number>()), (count) => {
				return count * 2;
			});

			// Assert
			expectTypeOf($computed).toEqualTypeOf<
				TComputedState<string, readonly [typeof $a, typeof $b]>
			>();
			expectTypeOf($computed.get()).toEqualTypeOf<string>();
			expectTypeOf($computed._sources).toEqualTypeOf<readonly [typeof $a, typeof $b]>();
			expectTypeOf($computed.destroy).toEqualTypeOf<() => void>();
			expectTypeOf($doubled.get()).toEqualTypeOf<number>();
		});

		it('should type set and value as read-only', () => {
			// Act
			const $count = createState(2);
			const $doubled = createComputed([$count], ([count]) => count * 2);
			const $withPriority = createComputed($count, (count) => count * 2).with(
				priorityQueueFeature<number>()
			);

			// Assert
			expectTypeOf($doubled.set).parameter(0).toEqualTypeOf<never>();
			expectTypeOf($doubled).toMatchTypeOf<TComputedState<number, readonly [typeof $count]>>();
			expectTypeOf($doubled.value).toEqualTypeOf<number>();
			expectTypeOf($withPriority.set).parameter(0).toEqualTypeOf<never>();
			expectTypeOf($withPriority.value).toEqualTypeOf<number>();
		});
	});

	describe('reactivity', () => {
		it('should initialize and recompute from a single source', () => {
			// Prepare
			const $count = createState(2);
			const $doubled = createComputed($count, (count) => count * 2);

			// Act
			$count.set(5);

			// Assert
			expect($doubled.get()).toBe(10);
		});

		it('should recompute from multiple sources', () => {
			// Prepare
			const $a = createState(1);
			const $b = createState(2);
			const $sum = createComputed([$a, $b] as const, ([a, b]) => a + b);

			// Act
			$b.set(4);

			// Assert
			expect($sum.get()).toBe(5);
		});

		it('should notify listeners with computed context', () => {
			// Prepare
			const $count = createState(2);
			const $doubled = createComputed($count, (count) => count * 2);
			const listener = vi.fn();
			$doubled.listen(listener);

			// Act
			$count.set(5, { listenerContext: { background: true } });

			// Assert
			expect(listener).toHaveBeenCalledWith({
				source: computedSourceKey,
				background: true,
				value: 10,
				prevValue: 4
			});
		});
	});

	describe('isEqual option', () => {
		it('should skip notifications when values are equal', () => {
			// Prepare
			const $obj = createState({ type: 'valid', count: 1 });
			const $derived = createComputed($obj, (obj) => ({ type: obj.type }), {
				isEqual: (prev, next) => prev.type === next.type
			});
			const listener = vi.fn();
			$derived.listen(listener);

			// Act
			$obj.set({ type: 'valid', count: 2 });

			// Assert
			expect(listener).not.toHaveBeenCalled();
		});
	});

	describe('destroy method', () => {
		it('should stop recomputing', () => {
			// Prepare
			const $count = createState(2);
			const $doubled = createComputed($count, (count) => count * 2);

			// Act
			$doubled.destroy();
			$count.set(5);

			// Assert
			expect($doubled.get()).toBe(4);
		});
	});

	describe('set method', () => {
		it('should throw when called', () => {
			// Prepare
			const $count = createState(2);
			const $doubled = createComputed($count, (count) => count * 2);

			// Act & Assert
			expect(() => $doubled.set(10 as never)).toThrow('Cannot call set()');
		});
	});

	describe('value property', () => {
		it('should throw when assigned', () => {
			// Prepare
			const $count = createState(2);
			const $doubled = createComputed($count, (count) => count * 2);

			// Act & Assert
			expect(() => {
				Object.assign($doubled, { value: 10 });
			}).toThrow('Cannot assign to value');
		});
	});
});
