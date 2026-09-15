import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { computedSourceKey, createComputed, type TComputedState } from './create-computed';
import { createState } from './create-state';
import { asyncQueueFeature, priorityQueueFeature, undoFeature } from './features';

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

	describe('subscription lifecycle', () => {
		it('should subscribe only while observed and reconnect with current values', () => {
			const $count = createState(1);
			const $doubled = createComputed($count, (count) => count * 2);
			expect($count._listeners).toHaveLength(0);

			const unlisten = $doubled.listen(vi.fn());
			const secondUnlisten = $doubled.listen(vi.fn());
			expect($count._listeners).toHaveLength(1);
			unlisten();
			unlisten();
			expect($count._listeners).toHaveLength(1);
			secondUnlisten();
			expect($count._listeners).toHaveLength(0);

			$count.set(3);
			const listener = vi.fn();
			const unsubscribe = $doubled.subscribe(listener);
			expect(listener).toHaveBeenCalledExactlyOnceWith({ value: 6, prevValue: 6 });
			expect($count._listeners).toHaveLength(1);
			unsubscribe();
			expect($count._listeners).toHaveLength(0);
		});

		it('should keep unobserved chains current without recomputing unchanged inputs', () => {
			const $count = createState(1);
			const compute = vi.fn((count: number) => ({ doubled: count * 2 }));
			const $doubled = createComputed($count, compute);
			const $label = createComputed($doubled, ({ doubled }) => `Value: ${doubled}`);
			const initial = $doubled.get();
			expect($doubled.value).toBe(initial);
			expect(compute).toHaveBeenCalledTimes(1);

			$count.set(3);
			expect(compute).toHaveBeenCalledTimes(1);
			expect($label.get()).toBe('Value: 6');
			expect(compute).toHaveBeenCalledTimes(2);
			expect($count._listeners).toHaveLength(0);

			const listener = vi.fn();
			const unsubscribe = $label.listen(listener);
			$count.set(4);
			expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'Value: 8' }));
			unsubscribe();
			expect($doubled._listeners).toHaveLength(0);
			expect($count._listeners).toHaveLength(0);
		});

		it('should refresh after an unobserved in-place mutation followed by notify', () => {
			const $source = createState({ count: 1 });
			const $count = createComputed($source, (value) => value.count);

			$source.value.count = 2;
			$source.notify();

			expect($count.value).toBe(2);
		});

		it('should release source subscriptions if connecting throws', () => {
			const $source = createState(1);
			const $computed = createComputed($source, (value) => {
				if (value === 2) {
					throw new Error('Cannot compute');
				}
				return value;
			});
			$source.set(2);

			expect(() => $computed.listen(vi.fn())).toThrow('Cannot compute');
			expect($source._listeners).toHaveLength(0);
			expect($computed._listeners).toHaveLength(0);

			$source.set(3);
			const unsubscribe = $computed.listen(vi.fn());
			expect($computed.get()).toBe(3);
			unsubscribe();
		});

		it.each([
			['async', asyncQueueFeature<number>],
			['priority', priorityQueueFeature<number>]
		] as const)(
			'should manage subscriptions with the %s queue on a computed state',
			async (_, queue) => {
				const $source = createState(1);
				const $computed = createComputed($source, (value) => value * 2).with(queue());
				const listener = vi.fn();
				const unsubscribe = $computed.subscribe(listener);
				expect($source._listeners).toHaveLength(1);

				$source.set(2);
				await $computed.notify();
				expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ value: 4 }));
				unsubscribe();
				expect($source._listeners).toHaveLength(0);

				$source.set(3);
				const reconnect = $computed.subscribe(listener);
				expect(listener).toHaveBeenLastCalledWith({ value: 6, prevValue: 6 });
				reconnect();
			}
		);

		it.each([
			['async', asyncQueueFeature<{ count: number }>],
			['priority', priorityQueueFeature<{ count: number }>]
		] as const)(
			'should track explicit notifications from an unobserved %s source',
			async (_, queue) => {
				const $source = createState({ count: 1 }).with(queue());
				const $count = createComputed($source, (value) => value.count);
				$source.value.count = 2;

				await $source.notify();

				expect($count.get()).toBe(2);
			}
		);
	});

	describe('isEqual option', () => {
		it('should retry an unobserved refresh when the comparator throws', () => {
			// Prepare
			const $source = createState(1);
			const isEqual = vi.fn(Object.is).mockImplementationOnce(() => {
				throw new Error('Cannot compare');
			});
			const $computed = createComputed($source, (value) => value * 2, { isEqual });
			$source.set(2);

			// Act & Assert
			expect(() => $computed.get()).toThrow('Cannot compare');
			expect($computed.get()).toBe(4);
		});

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
