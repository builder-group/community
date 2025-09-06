import { TFeatureDefinition } from '@blgc/types/features';
import type { TListenerContext, TListenerOptions, TState } from 'feature-state';
import React from 'react';

export function useSubscriber<GValue, GFeatures extends TFeatureDefinition[]>(
	state: TState<GValue, GFeatures> | null | undefined,
	callback: TUseSubscriberCallback<GValue>,
	deps: React.DependencyList = [],
	options: TUseSubscriberOptions<GValue> = {}
): void {
	const { ...listenerOptions } = options;

	React.useEffect(() => {
		let cleanup: (() => void) | undefined;

		const unbind = state?.subscribe(
			async (cx) => {
				cleanup?.();
				const result = await callback(cx);
				cleanup = typeof result === 'function' ? result : undefined;
			},
			{ key: 'use-subscriber', ...listenerOptions }
		);

		return () => {
			cleanup?.();
			unbind?.();
		};
	}, [state, ...deps]);
}

export interface TUseSubscriberOptions<GValue> extends TListenerOptions<GValue> {}

export type TUseSubscriberCallback<GValue> = (
	context: TListenerContext<GValue>
) => (() => void) | Promise<() => void>;
