import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { TTimestampFeature, type TLogger } from '../types';

export function withTimestamp<GFeatures extends TFeatureDefinition[]>(
	logger: TEnforceFeatureConstraint<TLogger<GFeatures>, TLogger<GFeatures>, []>
): TLogger<[TTimestampFeature, ...GFeatures]> {
	(logger as TLogger<[TTimestampFeature]>)._features.push('timestamp');

	logger._config.middlewares.push((next) => {
		return (logMethod, data) => {
			next(logMethod, [`[${new Date(Date.now()).toLocaleString()}]`, ...data]);
		};
	});

	return logger as TLogger<[TTimestampFeature, ...GFeatures]>;
}
