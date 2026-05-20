import { type TAnyFeature } from 'feature-core';
import type { TListenerContext, TState } from 'feature-state';
import React from 'react';
import { useEventCallback } from './use-event-callback';

/**
 * Subscribes to a state immediately and cleans the subscription up with the component.
 * The subscriber may return a cleanup function that runs before the next subscriber call and on unmount.
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
	// eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- callbacks may return nothing or a cleanup
) => (() => void) | void;
