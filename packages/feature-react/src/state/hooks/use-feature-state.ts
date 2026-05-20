import { type TAnyFeature } from 'feature-core';
import type { TState } from 'feature-state';
import React from 'react';

/**
 * Returns the current state value and re-renders when the state changes.
 * Passing `null` or `undefined` returns `null`; background updates do not force a render.
 */
export function useFeatureState<GState extends TAnyFeatureState>(
	state: GState
): TFeatureStateValue<GState> {
	const [, forceRender] = React.useReducer((value: number) => value + 1, 0);

	React.useEffect(() => {
		if (state == null) {
			return;
		}

		// Note: notify() is a render signal even when the state value keeps the same reference
		return state.listen(({ background }) => {
			if (background !== true) {
				forceRender();
			}
		});
	}, [state]);

	return (state == null ? null : state.get()) as TFeatureStateValue<GState>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- used only to accept arbitrary state value types in the public input
type TAnyFeatureState = TState<any, TAnyFeature[]> | null | undefined;

type TFeatureStateValue<GState> = GState extends TState<infer GValue, TAnyFeature[]>
	? GValue
	: null;
