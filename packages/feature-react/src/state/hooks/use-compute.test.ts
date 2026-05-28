// @vitest-environment happy-dom

import { createState } from 'feature-state';
import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTrackedState } from '../../__tests__/create-tracked-state';
import { cleanupRenderedHooks, renderHook } from '../../__tests__/render-hook';
import { useCompute } from './use-compute';

describe('useCompute function', () => {
	afterEach(cleanupRenderedHooks);

	it('should compute an initial derived value and re-render when it changes', () => {
		// Prepare
		const $count = createState(2);
		const hook = renderHook(() => useCompute($count, (count) => count * 2));

		// Act
		act(() => {
			$count.set(3);
		});

		// Assert
		expect(hook.result).toBe(6);
	});

	it('should skip re-rendering when the computed value is unchanged', () => {
		// Prepare
		const $item = createState({ type: 'a', count: 0 });
		let renderCount = 0;
		const hook = renderHook(() => {
			renderCount++;
			return useCompute($item, (item) => item.type);
		});

		// Act
		act(() => {
			$item.set({ type: 'a', count: 1 });
		});

		// Assert
		expect(hook.result).toBe('a');
		expect(renderCount).toBe(1);
	});

	it('should recompute when explicit dependencies change', () => {
		// Prepare
		const $count = createState(2);
		let multiplier = 2;
		const hook = renderHook(() => useCompute($count, (count) => count * multiplier, [multiplier]));

		// Act
		multiplier = 3;
		hook.rerender();

		// Assert
		expect(hook.result).toBe(6);
	});

	it('should use custom equality for fresh computed values', () => {
		// Prepare
		const $item = createState({ type: 'a', count: 0 });
		let renderCount = 0;
		const hook = renderHook(() => {
			renderCount++;
			return useCompute(
				$item,
				(item) => ({ type: item.type }),
				[],
				(next, current) => next.type === current.type
			);
		});

		// Act
		act(() => {
			$item.set({ type: 'a', count: 1 });
		});

		// Assert
		expect(hook.result).toStrictEqual({ type: 'a' });
		expect(renderCount).toBe(1);
	});

	it('should defer background updates until the next render', () => {
		// Prepare
		const $count = createState(1);
		const hook = renderHook(() => useCompute($count, (count) => count * 2));

		// Act
		act(() => {
			$count.set(2, { listenerContext: { background: true } });
		});

		// Assert
		expect(hook.result).toBe(2);

		// Act
		hook.rerender();

		// Assert
		expect(hook.result).toBe(4);
	});

	it('should subscribe to duplicate tuple states once', () => {
		// Prepare
		const $count = createTrackedState(2);
		const hook = renderHook(() =>
			useCompute([$count, null, $count] as const, ([first, missing, second]) => {
				return first + (missing ?? 10) + second;
			})
		);

		// Assert
		expect(hook.result).toBe(14);
		expect($count.listenCount).toBe(1);

		// Act
		hook.unmount();

		// Assert
		expect($count.unlistenCount).toBe(1);
	});
});
