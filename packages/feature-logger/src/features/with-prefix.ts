import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { TPrefixFeature, type TLogger } from '../types';

export function withPrefix<GFeatures extends TFeatureDefinition[]>(
	logger: TEnforceFeatureConstraint<TLogger<GFeatures>, TLogger<GFeatures>, []>,
	prefix: string
): TLogger<[TPrefixFeature, ...GFeatures]> {
	(logger as TLogger<[TPrefixFeature]>)._features.push('prefix');

	logger._config.middlewares.push((next) => {
		return (logMethod, data) => {
			next(logMethod, [prefix, ...data]);
		};
	});

	return logger as TLogger<[TPrefixFeature, ...GFeatures]>;
}
