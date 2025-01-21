import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { getNestedProperty } from '@blgc/utils';
import { TSelectorFeature, type TState } from '../types';

export function withSelector<GValue, GFeatures extends TFeatureDefinition[]>(
	initialState: TEnforceFeatureConstraint<TState<GValue, GFeatures>, TState<GValue, GFeatures>, []>
): TState<GValue, [TSelectorFeature<GValue>, ...GFeatures]> {
	const selectorFeature: TSelectorFeature<GValue, [TSelectorFeature<GValue, GFeatures>]>['api'] = {
		_pv: initialState._v,
		listenToSelected(
			this: TState<GValue, [TSelectorFeature<GValue, GFeatures>]>,
			queueIf,
			callback,
			listenOptions = {}
		) {
			return this.listen(callback, {
				...listenOptions,
				key: 'with-selector_selector',
				queueIf: ({ state, changedProperties }) => {
					return (
						// Notify if we can't verify what changed (assume everything changed)
						(state._pv == null && changedProperties == null) ||
						// Notify if any changed property matches or is a parent of any selected property
						(changedProperties != null &&
							Array.isArray(changedProperties) &&
							Array.isArray(queueIf) &&
							queueIf.some((selectedProp) =>
								changedProperties?.some((changedProp) =>
									selectedProp.toString().startsWith(changedProp.toString())
								)
							)) ||
						// Notify if any selected property's value has changed
						(state._pv != null &&
							((Array.isArray(queueIf) &&
								queueIf.some(
									(selectedProp) =>
										getNestedProperty(state._v, selectedProp) !==
										getNestedProperty(state._pv, selectedProp)
								)) ||
								(typeof queueIf === 'function' && queueIf(state._v) !== queueIf(state._pv))))
					);
				}
			});
		}
	};

	// Merge existing features from the state with the new selector feature
	const extendedState = Object.assign(initialState, selectorFeature) as unknown as TState<
		GValue,
		[TSelectorFeature<GValue>]
	>;
	extendedState._features.push('selector');

	extendedState.listen(
		({ state }) => {
			state._pv = state._v;
		},
		{ key: 'with-selector_prev-value', level: 99 }
	);

	return extendedState as unknown as TState<GValue, [TSelectorFeature<GValue>, ...GFeatures]>;
}
