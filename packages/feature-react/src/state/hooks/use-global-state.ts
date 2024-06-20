import type { TState } from 'feature-state';
import React from 'react';
import { hasProperty } from '@ibg/utils';

export function useGlobalState<GValue>(state: TState<GValue, ['base']>): Readonly<GValue> {
	const [, forceRender] = React.useReducer((s: number) => s + 1, 0);

	React.useEffect(() => {
		const unbind = state.listen(
			({ data }) => {
				if (!(hasProperty(data, 'background') && data.background)) {
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
