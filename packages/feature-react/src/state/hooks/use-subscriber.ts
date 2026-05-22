import { type TAnyFeature } from 'feature-core';
import type { TListenerContext, TState } from 'feature-state';
import React from 'react';
import { useEventCallback } from './use-event-callback';

/**
 * Calls `callback` immediately with the current state value, then on every future change,
 * matching `state.subscribe()`. The callback may return a cleanup function that runs before
 * the next call and on unmount. Pass `null` or `undefined` as `state` to opt out without
 * conditionally calling the hook.
 *
 * @param state - The state to subscribe to, or `null`/`undefined` to skip.
 * @param callback - Receives the listener context on every call. May return a cleanup function.
 */
export function useSubscriber<GValue, GFeatures extends TAnyFeature[]>(
	state: TState<GValue, GFeatures> | null | undefined,
	callback: TUseSubscriberCallback<GValue>
): void {
	const stableCallback = useEventCallback(callback);

	React.useEffect(() => {
		let cleanup: (() => void) | undefined;

		const unbind = state?.subscribe((context) => {
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

export type TUseSubscriberCallback<GValue> = (
	context: TListenerContext<GValue>
	// eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- callbacks may return nothing, async work, or a cleanup
) => (() => void) | Promise<void> | void;
