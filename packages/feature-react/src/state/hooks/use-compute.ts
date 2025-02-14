import { TFeatureDefinition } from '@blgc/types/features';
import type { TState } from 'feature-state';
import React from 'react';

export function useCompute<GValue, GFeatures extends TFeatureDefinition[], GComputed>(
	state: TState<GValue, GFeatures>,
	compute: (value: Readonly<GValue>) => GComputed,
	options: TComputeOptions<GComputed> = {},
	deps: unknown[] = []
): GComputed {
	const { compare = Object.is } = options;
	const [, forceRender] = React.useReducer((s: number) => s + 1, 0);

	const lastComputedRef = React.useRef<GComputed>(compute(state._v));

	React.useEffect(() => {
		const unbind = state.listen(
			({ background, value }) => {
				const newComputed = compute(value);

				// Only trigger re-render if computed value changed and not in background
				if (!background && !compare(newComputed, lastComputedRef.current)) {
					lastComputedRef.current = newComputed;
					forceRender();
				}
				// Still update the ref in background, but don't trigger render
				else if (background) {
					lastComputedRef.current = newComputed;
				}
			},
			{ key: 'use-compute' }
		);

		return () => {
			unbind();
		};
	}, [state, ...deps]);

	return lastComputedRef.current;
}

interface TComputeOptions<GComputed> {
	compare?: (a: GComputed, b: GComputed) => boolean;
}
