// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest';
import { cleanupRenderedHooks, renderHook } from '../../__tests__/render-hook';
import { useEventCallback } from './use-event-callback';

describe('useEventCallback function', () => {
	afterEach(cleanupRenderedHooks);

	it('should keep a stable reference that calls the latest callback', () => {
		// Prepare
		let value = 'initial';
		const hook = renderHook(() => useEventCallback(() => value));
		const callback = hook.result;

		// Act
		value = 'updated';
		hook.rerender();

		// Assert
		expect(hook.result).toBe(callback);
		expect(hook.result()).toBe('updated');
	});
});
