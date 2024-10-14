import type { TState } from 'feature-state';
import React from 'react';
import { getNestedProperty, type TNestedPath, type TNestedProperty } from '@blgc/utils';

export function useSelected<GValue, GPath extends TNestedPath<GValue>>(
	state: TState<GValue, ['base']>,
	selectedProperty: GPath
): Readonly<TNestedProperty<GValue, GPath>> {
	const [, forceRender] = React.useReducer((s: number) => s + 1, 0);

	React.useEffect(() => {
		const unbind = state.listen(
			({ background }) => {
				if (!background) {
					forceRender();
				}
			},
			{ key: 'use-selected', selectedProperty }
		);

		return () => {
			unbind();
		};
	}, [state]);

	return getNestedProperty(state._value, selectedProperty);
}
