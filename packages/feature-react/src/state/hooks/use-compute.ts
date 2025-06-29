import { TNullableStateValue, type TListenerOptions, type TState } from 'feature-state';
import React from 'react';

export function useCompute<
	GState extends TState<any, any> | undefined | null,
	GValue extends TNullableStateValue<GState>,
	GComputed
>(
	state: GState,
	compute: (value: GValue) => GComputed,
	deps: React.DependencyList = [],
	options: TUseComputeOptions<any, GComputed> = {}
): GComputed {
	const { isEqual = Object.is, ...listenerOptions } = options;
	const [, forceRender] = React.useReducer((s: number) => s + 1, 0);

	const lastComputedRef = React.useRef<GComputed>(compute(state == null ? null : state._v));

	React.useEffect(() => {
		// If state is null/undefined, compute with null and update if needed
		if (state == null) {
			const newComputed = compute(null as GValue);
			if (!isEqual(newComputed, lastComputedRef.current)) {
				forceRender();
			}
			lastComputedRef.current = newComputed;
			return;
		}

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
