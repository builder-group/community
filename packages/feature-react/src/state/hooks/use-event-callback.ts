import React from 'react';
import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect';

/**
 * Returns a stable callback reference that always delegates to the latest implementation.
 * Prevents effect re-registration when an inline callback changes between renders.
 *
 * Serves the same role as `useEffectEvent` while this package supports React 18.
 */
export function useEventCallback<GArgs extends unknown[], GReturn>(
	callback: (...args: GArgs) => GReturn
): (...args: GArgs) => GReturn {
	const callbackRef = React.useRef(callback);

	useIsomorphicLayoutEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	return React.useCallback((...args: GArgs) => callbackRef.current(...args), []);
}
