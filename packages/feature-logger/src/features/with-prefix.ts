import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { TPrefixFeature, type TLogger } from '../types';

export function withPrefix<GFeatures extends TFeatureDefinition[]>(
	baseLogger: TEnforceFeatureConstraint<TLogger<GFeatures>, TLogger<GFeatures>, []>,
	prefix: string
): TLogger<[TPrefixFeature, ...GFeatures]> {
	(baseLogger as TLogger<[TPrefixFeature]>)._features.push('prefix');

	baseLogger._config.middlewares.push((next) => {
		return (logMethod, data) => {
			next(logMethod, [prefix, ...data]);
		};
	});

	return baseLogger as TLogger<[TPrefixFeature, ...GFeatures]>;
}
