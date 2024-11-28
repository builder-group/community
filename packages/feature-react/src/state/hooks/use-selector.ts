import { getNestedProperty, type TNestedPath, type TNestedProperty } from '@blgc/utils';
import type { TState } from 'feature-state';
import React from 'react';

export function useSelector<GValue, GPath extends TNestedPath<GValue>>(
	state: TState<GValue, ['base', 'selector']>,
	selectedProperty: GPath
): Readonly<TNestedProperty<GValue, GPath>> {
	const [, forceRender] = React.useReducer((s: number) => s + 1, 0);

	React.useEffect(() => {
		const unbind = state.listenToSelected(
			[selectedProperty],
			({ background }) => {
				if (!background) {
					forceRender();
				}
			},
			{ key: 'use-selected' }
		);

		return () => {
			unbind();
		};
	}, [state]);

	return getNestedProperty(state._v, selectedProperty);
}
