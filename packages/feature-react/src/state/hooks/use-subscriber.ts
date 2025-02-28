import { TFeatureDefinition } from '@blgc/types/features';
import type { TListenerCallback, TListenerOptions, TState } from 'feature-state';
import React from 'react';

export function useSubscriber<GValue, GFeatures extends TFeatureDefinition[]>(
	state: TState<GValue, GFeatures> | null | undefined,
	callback: TListenerCallback<GValue>,
	options: TUseSubscriberOptions<GValue> = {}
): void {
	const { deps = [], ...listenerOptions } = options;

	React.useEffect(() => {
		const unbind = state?.subscribe(callback, { key: 'use-subscriber', ...listenerOptions });
		return () => {
			unbind?.();
		};
	}, [state, ...deps]);
}

export interface TUseSubscriberOptions<GValue> extends TListenerOptions<GValue> {
	deps?: React.DependencyList;
}
