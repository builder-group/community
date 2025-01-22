import { TFeatureDefinition } from '@blgc/types/features';
import type { TListenerContext, TState } from 'feature-state';
import React from 'react';

export function useFeatureStateWithMiddleware<GValue, GFeatures extends TFeatureDefinition[]>(
	state: TState<GValue, GFeatures>,
	middleware: TFeatureStateMiddleware<GValue>[] = []
): Readonly<GValue> {
	const [, forceRender] = React.useReducer((s: number) => s + 1, 0);

	React.useEffect(() => {
		const unbind = state.listen(
			(data) => {
				const processedData = middleware.reduce((acc, middlewareFn) => middlewareFn(acc), data);

				if (!processedData.background) {
					forceRender();
				}
			},
			{ key: 'use-feature-state-with-middleware' }
		);

		return () => {
			unbind();
		};
	}, [state, middleware]);

	return state._v;
}

export type TFeatureStateMiddleware<GValue> = (
	context: TListenerContext<GValue>
) => TListenerContext<GValue>;
