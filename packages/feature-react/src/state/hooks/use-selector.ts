import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { getNestedProperty, type TNestedPath, type TNestedProperty } from '@blgc/utils';
import { isStateWithFeatures, TSelectorFeature, TState } from 'feature-state';
import React from 'react';

export function useSelector<
	GValue,
	GFeatures extends TFeatureDefinition[],
	GPath extends TNestedPath<GValue>
>(
	state: TEnforceFeatureConstraint<
		TState<GValue, GFeatures>,
		TState<GValue, GFeatures>,
		['selector']
	>,
	selectedProperty: GPath
): Readonly<TNestedProperty<GValue, GPath>> {
	const [, forceRender] = React.useReducer((s: number) => s + 1, 0);

	React.useEffect(() => {
		let unbind: () => void | undefined;

		if (isStateWithFeatures<GValue, [TSelectorFeature<GValue>]>(state, ['selector'])) {
			unbind = state.listenToSelected(
				[selectedProperty],
				({ background }) => {
					if (!background) {
						forceRender();
					}
				},
				{ key: 'use-selected' }
			);
		}

		return () => {
			unbind();
		};
	}, [state]);

	if (!isStateWithFeatures<GValue, [TSelectorFeature<GValue>]>(state, ['selector'])) {
		throw Error('State must have "selector" feature to use useSelector');
	}

	return getNestedProperty(state._v, selectedProperty);
}
