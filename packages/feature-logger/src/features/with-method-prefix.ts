import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { isLoggerWithFeatures } from '../is-logger-with-features';
import { TMethodPrefixFeature, type TLogger } from '../types';

export function withMethodPrefix<GFeatures extends TFeatureDefinition[]>(
	logger: TEnforceFeatureConstraint<TLogger<GFeatures>, TLogger<GFeatures>, []>
): TLogger<[TMethodPrefixFeature, ...GFeatures]> {
	(logger as TLogger<[TMethodPrefixFeature]>)._features.push('methodPrefix');
	const withTimestamp = isLoggerWithFeatures(logger, ['timestamp']);

	logger._config.middlewares.push((next) => {
		return (logMethod, data) => {
			const prefix = `${logMethod.charAt(0).toUpperCase() + logMethod.slice(1)}:`;
			if (withTimestamp) {
				next(logMethod, [data[0], prefix, ...data.slice(1)]);
			} else {
				next(logMethod, [prefix, ...data]);
			}
		};
	});

	return logger as TLogger<[TMethodPrefixFeature, ...GFeatures]>;
}
