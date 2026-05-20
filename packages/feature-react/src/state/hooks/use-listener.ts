import { type TAnyFeature } from 'feature-core';
import type { TListenerContext, TState } from 'feature-state';
import React from 'react';
import { useEventCallback } from './use-event-callback';

/**
 * Registers a state listener for side effects and cleans it up with the component.
 * The listener may return a cleanup function that runs before the next listener call and on unmount.
 */
export function useListener<GValue, GFeatures extends TAnyFeature[]>(
	state: TState<GValue, GFeatures> | null | undefined,
	callback: TUseListenerCallback<GValue>
): void {
	const stableCallback = useEventCallback(callback);

	React.useEffect(() => {
		let cleanup: (() => void) | undefined;

		const unbind = state?.listen((context) => {
			cleanup?.();
			const result = stableCallback(context);
			cleanup = typeof result === 'function' ? result : undefined;
		});

		return () => {
			cleanup?.();
			unbind?.();
		};
	}, [state, stableCallback]);
}

export type TUseListenerCallback<GValue> = (
	context: TListenerContext<GValue>
) => (() => void) | void;
