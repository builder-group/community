import { TFeatureDefinition } from '@blgc/types/features';
import type { TState } from 'feature-state';
import React from 'react';

export function useFeatureState<GValue, GFeatures extends TFeatureDefinition[]>(
	state: TState<GValue, GFeatures>
): Readonly<GValue> {
	const [, forceRender] = React.useReducer((s: number) => s + 1, 0);

	React.useEffect(() => {
		const unbind = state.listen(
			({ background }) => {
				if (!background) {
					forceRender();
				}
			},
			{ key: 'use-global-state' }
		);

		return () => {
			unbind();
		};
	}, [state]);

	return state._v;
}
