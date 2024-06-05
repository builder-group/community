import type { TState } from 'feature-state';
import React from 'react';

export function useFeatureState<GValue>(state: TState<GValue, ['base']>): GValue {
	const [, forceRender] = React.useReducer((s: number) => s + 1, 0);

	React.useEffect(() => {
		const unbind = state.listen(() => {
			forceRender();
		});
		return () => {
			unbind();
		};
	}, []);

	return state._value;
}
