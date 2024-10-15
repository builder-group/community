import { getNestedProperty } from '@blgc/utils';

import {
	type TEnforceFeatures,
	type TFeatureKeys,
	type TSelectFeatures,
	type TState
} from '../types';

export function withSelector<GValue, GSelectedFeatureKeys extends TFeatureKeys<GValue>[]>(
	state: TState<GValue, TEnforceFeatures<GSelectedFeatureKeys, ['base']>>
): TState<GValue, ['selector', ...GSelectedFeatureKeys]> {
	const selectorFeature: TSelectFeatures<GValue, ['selector']> = {
		listenToSelected(this: TState<GValue, ['selector']>, callIf, callback, listenOptions = {}) {
			return this.listen(callback, {
				...listenOptions,
				callIf: ({ newValue, prevValue, additionalData }) => {
					return (
						// Notify if we can't verify what changed (assume everything changed)
						(prevValue == null && additionalData?.changedProperties == null) ||
						// Notify if any changed property matches or is a parent of any selected property
						(additionalData?.changedProperties != null &&
							Array.isArray(additionalData.changedProperties) &&
							Array.isArray(callIf) &&
							callIf.some((selectedProp) =>
								additionalData.changedProperties?.some((changedProp) =>
									selectedProp.toString().startsWith(changedProp.toString())
								)
							)) ||
						// Notify if any selected property's value has changed
						(prevValue != null &&
							((Array.isArray(callIf) &&
								callIf.some(
									(selectedProp) =>
										getNestedProperty(newValue, selectedProp) !==
										getNestedProperty(prevValue as GValue, selectedProp)
								)) ||
								(typeof callIf === 'function' && callIf(newValue) !== callIf(prevValue as GValue))))
					);
				}
			});
		}
	};

	// Merge existing features from the state with the new selector feature
	const _state = Object.assign(state, selectorFeature) as unknown as TState<
		GValue,
		['selector', 'base']
	>;
	_state._features.push('selector');

	return _state as unknown as TState<GValue, ['selector', ...GSelectedFeatureKeys]>;
}
