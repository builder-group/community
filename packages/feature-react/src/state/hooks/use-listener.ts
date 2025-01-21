import { TFeatureDefinition } from '@blgc/types/features';
import type { TListenerCallback, TListenerOptions, TState } from 'feature-state';
import React from 'react';

export function useListener<GValue, GFeatures extends TFeatureDefinition[]>(
	state: TState<GValue, GFeatures> | null | undefined,
	callback: TListenerCallback<GValue>,
	options: TListenerOptions<GValue> = {},
	deps: unknown[] = []
): void {
	React.useEffect(() => {
		const unbind = state?.listen(callback, { key: 'use-listener', ...options });
		return () => {
			unbind?.();
		};
	}, [state, ...deps]);
}
