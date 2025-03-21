import { TFeatureDefinition } from '@blgc/types/features';
import type { TListenerCallback, TListenerOptions, TState } from 'feature-state';
import React from 'react';

export function useListener<GValue, GFeatures extends TFeatureDefinition[]>(
	state: TState<GValue, GFeatures> | null | undefined,
	callback: TListenerCallback<GValue>,
	deps: React.DependencyList = [],
	options: TUseListenerOptions<GValue> = {}
): void {
	const { ...listenerOptions } = options;

	React.useEffect(() => {
		const unbind = state?.listen(callback, { key: 'use-listener', ...listenerOptions });
		return () => {
			unbind?.();
		};
	}, [state, ...deps]);
}

export interface TUseListenerOptions<GValue> extends TListenerOptions<GValue> {}
