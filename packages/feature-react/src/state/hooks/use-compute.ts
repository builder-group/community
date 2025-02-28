import { TFeatureDefinition } from '@blgc/types/features';
import type { TListenerOptions, TState } from 'feature-state';
import React from 'react';

export function useCompute<GValue, GFeatures extends TFeatureDefinition[], GComputed>(
	state: TState<GValue, GFeatures>,
	compute: (value: Readonly<GValue>) => GComputed,
	options: TUseComputeOptions<GValue, GComputed> = {}
): GComputed {
	const { isEqual = Object.is, deps = [], ...listenerOptions } = options;
	const [, forceRender] = React.useReducer((s: number) => s + 1, 0);

	const lastComputedRef = React.useRef<GComputed>(compute(state._v));

	React.useEffect(() => {
		const unbind = state.listen(
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
	deps?: React.DependencyList;
}
