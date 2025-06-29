import type { TNullableStateValue, TState } from 'feature-state';
import React from 'react';

export function useFeatureState<
	GState extends TState<any, any> | undefined | null,
	GValue extends TNullableStateValue<GState>
>(state: GState): GValue {
	const [, forceRender] = React.useReducer((s: number) => s + 1, 0);

	React.useEffect(() => {
		// No subscription needed for null/undefined state
		if (state == null) {
			return;
		}

		const unbind = state.listen(
			({ background }) => {
				if (!background) {
					forceRender();
				}
			},
			{ key: 'use-feature-state' }
		);

		return () => {
			unbind();
		};
	}, [state]);

	return (state == null ? null : state._v) as GValue;
}
