// @vitest-environment happy-dom

import { createState } from 'feature-state';
import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTrackedState, type TTrackedState } from '../../__tests__/create-tracked-state';
import { cleanupRenderedHooks, renderHook } from '../../__tests__/render-hook';
import { useFeatureState } from './use-feature-state';

describe('useFeatureState function', () => {
	afterEach(cleanupRenderedHooks);

	it('should return the current value and re-render on state changes', () => {
		// Prepare
		const $count = createState(1);
		const hook = renderHook(() => useFeatureState($count));

		// Act
		act(() => {
			$count.set(2);
		});

		// Assert
		expect(hook.result).toBe(2);
	});

	it('should defer background updates until the next render', () => {
		// Prepare
		const $count = createState(1);
		const hook = renderHook(() => useFeatureState($count));

		// Act
		act(() => {
			$count.set(2, { listenerContext: { background: true } });
		});

		// Assert
		expect(hook.result).toBe(1);

		// Act
		hook.rerender();

		// Assert
		expect(hook.result).toBe(2);
	});

	it('should return null and unsubscribe when the state becomes null', () => {
		// Prepare
		const $count = createTrackedState(1);
		let state: TTrackedState<number> | null = $count;
		const hook = renderHook(() => useFeatureState(state));

		// Act
		state = null;
		hook.rerender();

		// Assert
		expect(hook.result).toBeNull();
		expect($count.unlistenCount).toBe(1);
	});

	it('should resubscribe when the state changes', () => {
		// Prepare
		const $first = createTrackedState(1);
		const $second = createTrackedState(10);
		let state: TTrackedState<number> | null = $first;
		const hook = renderHook(() => useFeatureState(state));

		// Act
		state = $second;
		hook.rerender();

		// Assert
		expect(hook.result).toBe(10);
		expect($first.unlistenCount).toBe(1);
		expect($second.listenCount).toBe(1);
	});
});
