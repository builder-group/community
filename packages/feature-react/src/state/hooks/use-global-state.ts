import type { TState } from 'feature-state';
import React from 'react';

export function useGlobalState<GValue>(state: TState<GValue, ['base']>): Readonly<GValue> {
	const [, forceRender] = React.useReducer((s: number) => s + 1, 0);

	React.useEffect(() => {
		const unbind = state.listen(
			({ data }) => {
				if (!data?.background) {
					forceRender();
				}
			},
			{ key: 'use-global-state' }
		);

		return () => {
			unbind();
		};
	}, []);

	return state.get();
}
