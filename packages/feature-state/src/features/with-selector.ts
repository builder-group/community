import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { getNestedProperty } from '@blgc/utils';
import { TSelectorFeature, type TState } from '../types';

export function withSelector<GValue, GFeatures extends TFeatureDefinition[]>(
	baseState: TEnforceFeatureConstraint<TState<GValue, GFeatures>, TState<GValue, GFeatures>, []>
): TState<GValue, [TSelectorFeature<GValue>, ...GFeatures]> {
	const selectorFeature: TSelectorFeature<GValue>['api'] = {
		listenToSelected(
			this: TState<GValue, [TSelectorFeature<GValue>]>,
			queueIf,
			callback,
			listenOptions = {}
		) {
			return this.listen(callback, {
				...listenOptions,
				key: 'with-selector_selector',
				queueIf: ({ value, prevValue, changedProperties }) => {
					return (
						// Notify if we can't verify what changed (assume everything changed)
						(prevValue == null && changedProperties == null) ||
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
						(prevValue != null &&
							((Array.isArray(queueIf) &&
								queueIf.some(
									(selectedProp) =>
										getNestedProperty(value, selectedProp) !==
										getNestedProperty(prevValue as GValue, selectedProp)
								)) ||
								(typeof queueIf === 'function' && queueIf(value) !== queueIf(prevValue))))
					);
				}
			});
		}
	};

	// Extend the base state with the selector feature
	const extendedState = Object.assign(baseState, selectorFeature) as TState<
		GValue,
		[TSelectorFeature<GValue>]
	>;
	extendedState._features.push('selector');

	return extendedState as unknown as TState<GValue, [TSelectorFeature<GValue>, ...GFeatures]>;
}
