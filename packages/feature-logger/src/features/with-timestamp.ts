import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { TTimestampFeature, type TLogger } from '../types';

export function withTimestamp<GFeatures extends TFeatureDefinition[]>(
	baseLogger: TEnforceFeatureConstraint<TLogger<GFeatures>, TLogger<GFeatures>, []>
): TLogger<[TTimestampFeature, ...GFeatures]> {
	(baseLogger as TLogger<[TTimestampFeature]>)._features.push('timestamp');

	baseLogger._config.middlewares.push((next) => {
		return (logMethod, data) => {
			next(logMethod, [`[${new Date(Date.now()).toLocaleString()}]`, ...data]);
		};
	});

	return baseLogger as TLogger<[TTimestampFeature, ...GFeatures]>;
}
