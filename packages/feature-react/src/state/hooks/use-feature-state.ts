import { type TAnyFeature } from 'feature-core';
import type { TState } from 'feature-state';
import React from 'react';

/**
 * Returns the current state value and re-renders when the state changes.
 * Passing `null` or `undefined` returns `null`; background updates do not force a render.
 */
export function useFeatureState(state: null | undefined): null;
export function useFeatureState<GValue, GFeatures extends TAnyFeature[]>(
	state: TState<GValue, GFeatures>
): GValue;
export function useFeatureState<GValue, GFeatures extends TAnyFeature[]>(
	state: TState<GValue, GFeatures> | null | undefined
): GValue | null;
export function useFeatureState<GValue, GFeatures extends TAnyFeature[]>(
	state: TState<GValue, GFeatures> | null | undefined
): GValue | null {
	const [, forceRender] = React.useReducer((value: number) => value + 1, 0);

	React.useEffect(() => {
		if (state == null) {
			return;
		}

		const unbind = state.listen(({ background }) => {
			if (background !== true) {
				forceRender();
			}
		});

		return () => {
			unbind();
		};
	}, [state]);

	return (state == null ? null : state.get()) as GValue;
}
