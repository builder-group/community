// @vitest-environment happy-dom

import { createState } from 'feature-state';
import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTrackedState, type TTrackedState } from '../../__tests__/create-tracked-state';
import { cleanupRenderedHooks, renderHook } from '../../__tests__/render-hook';
import { useSubscriber } from './use-subscriber';

describe('useSubscriber function', () => {
	afterEach(cleanupRenderedHooks);

	it('should call the callback immediately and for future changes', () => {
		// Prepare
		const $count = createState(1);
		const values: Array<readonly [value: number, prevValue: number | undefined]> = [];
		renderHook(() => {
			useSubscriber($count, ({ value, prevValue }) => {
				values.push([value, prevValue]);
			});
		});

		// Act
		act(() => {
			$count.set(2);
		});

		// Assert
		expect(values).toStrictEqual([
			[1, 1],
			[2, 1]
		]);
	});

	it('should run cleanup before the next callback and on unmount', () => {
		// Prepare
		const $count = createState(0);
		const values: number[] = [];
		const cleanups: number[] = [];
		const hook = renderHook(() => {
			useSubscriber($count, ({ value }) => {
				values.push(value);
				return () => cleanups.push(value);
			});
		});

		// Act
		act(() => {
			$count.set(1);
		});
		hook.unmount();

		// Assert
		expect(values).toStrictEqual([0, 1]);
		expect(cleanups).toStrictEqual([0, 1]);
	});

	it('should use the latest callback without resubscribing', () => {
		// Prepare
		const $count = createTrackedState(1);
		const values: number[] = [];
		let multiplier = 1;
		const hook = renderHook(() => {
			useSubscriber($count, ({ value }) => {
				values.push(value * multiplier);
			});
		});

		// Act
		multiplier = 2;
		hook.rerender();
		act(() => {
			$count.set(2);
		});

		// Assert
		expect($count.listenCount).toBe(1);
		expect(values).toStrictEqual([1, 4]);
	});

	it('should resubscribe when the state changes', () => {
		// Prepare
		const $first = createTrackedState(1);
		const $second = createTrackedState(10);
		const values: number[] = [];
		let state: TTrackedState<number> | null = $first;
		const hook = renderHook(() => {
			useSubscriber(state, ({ value }) => {
				values.push(value);
			});
		});

		// Act
		state = $second;
		hook.rerender();
		act(() => {
			$first.set(2);
			$second.set(11);
		});

		// Assert
		expect($first.unlistenCount).toBe(1);
		expect($second.listenCount).toBe(1);
		expect(values).toStrictEqual([1, 10, 11]);
	});
});
