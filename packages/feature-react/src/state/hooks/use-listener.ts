import { TFeatureDefinition } from '@blgc/types/features';
import type { TListenerContext, TListenerOptions, TState } from 'feature-state';
import React from 'react';

export function useListener<GValue, GFeatures extends TFeatureDefinition[]>(
	state: TState<GValue, GFeatures> | null | undefined,
	callback: TUseListenerCallback<GValue>,
	deps: React.DependencyList = [],
	options: TUseListenerOptions<GValue> = {}
): void {
	const { ...listenerOptions } = options;

	React.useEffect(() => {
		let cleanup: (() => void) | undefined;

		const unbind = state?.listen(
			async (cx) => {
				cleanup?.();
				const result = await callback(cx);
				cleanup = typeof result === 'function' ? result : undefined;
			},
			{ key: 'use-listener', ...listenerOptions }
		);

		return () => {
			cleanup?.();
			unbind?.();
		};
	}, [state, ...deps]);
}

export interface TUseListenerOptions<GValue> extends TListenerOptions<GValue> {}

export type TUseListenerCallback<GValue> = (
	context: TListenerContext<GValue>
) => (() => void) | Promise<() => void> | void | Promise<void>;
