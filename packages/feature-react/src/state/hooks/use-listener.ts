import { type TAnyFeature } from 'feature-core';
import type { TListenerContext, TState } from 'feature-state';
import React from 'react';
import { useEventCallback } from './use-event-callback';

/**
 * Registers a listener for state changes as a side effect and removes it when the component unmounts.
 *
 * The callback fires on every future change, matching `state.listen()`. It can return a cleanup
 * function that runs before the next invocation and on unmount. Pass `null` or `undefined`
 * for `state` to register no listener.
 *
 * @param state - The state to listen to, or `null`/`undefined` to skip.
 * @param callback - Runs on each state change. May return a cleanup function.
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
	// eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- callbacks may return nothing, async work, or a cleanup
) => (() => void) | Promise<void> | void;
