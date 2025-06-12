import { TFeatureDefinition } from '@blgc/types/features';
import { type TListenerOptions, type TState } from 'feature-state';
import React from 'react';

export function useCompute<GValue, GFeatures extends TFeatureDefinition[], GComputed>(
	state: TState<GValue, GFeatures>,
	compute: (value: Readonly<GValue>) => GComputed,
	deps: React.DependencyList = [],
	options: TUseComputeOptions<GValue, GComputed> = {}
): GComputed {
	const { isEqual = Object.is, ...listenerOptions } = options;
	const [, forceRender] = React.useReducer((s: number) => s + 1, 0);

	const lastComputedRef = React.useRef<GComputed>(compute(state._v));

	React.useEffect(() => {
		// Use subscribe to ensure lastComputedRef is updated when useEffect re-runs on component re-renders,
		// even if the state value hasn't changed since the last subscription
		// but the state instance might have changed.
		const unbind = state.subscribe(
			({ background, value }) => {
				const newComputed = compute(value);

				// Only trigger re-render if computed value changed and not in background
				if (!background && !isEqual(newComputed, lastComputedRef.current)) {
					forceRender();
				}
				lastComputedRef.current = newComputed;
			},
			{ key: 'use-compute', ...listenerOptions }
		);

		return () => {
			unbind();
		};
	}, [state, ...deps]);

	return lastComputedRef.current;
}

interface TUseComputeOptions<GValue, GComputed> extends TListenerOptions<GValue> {
	isEqual?: (a: GComputed, b: GComputed) => boolean;
}
