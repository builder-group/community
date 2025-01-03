import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { getNestedProperty } from '@blgc/utils';
import { TSelectorFeature, type TState } from '../types';

export function withSelector<GValue, GFeatures extends TFeatureDefinition[]>(
	state: TEnforceFeatureConstraint<TState<GValue, GFeatures>, TState<GValue, GFeatures>, []>
): TState<GValue, [TSelectorFeature<GValue>, ...GFeatures]> {
	const selectorFeature: TSelectorFeature<GValue>['api'] = {
		listenToSelected(
			this: TState<GValue, [TSelectorFeature<GValue>]>,
			callIf,
			callback,
			listenOptions = {}
		) {
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
	const _state = Object.assign(state, selectorFeature) as TState<
		GValue,
		[TSelectorFeature<GValue>]
	>;
	_state._features.push('selector');

	return _state as unknown as TState<GValue, [TSelectorFeature<GValue>, ...GFeatures]>;
}
