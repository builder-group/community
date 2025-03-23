import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { TLoggerMiddleware, TPrefixFeature, type TLogger } from '../types';

export function withPrefix<GFeatures extends TFeatureDefinition[]>(
	baseLogger: TEnforceFeatureConstraint<TLogger<GFeatures>, TLogger<GFeatures>, []>,
	prefix: string
): TLogger<[TPrefixFeature, ...GFeatures]> {
	(baseLogger as TLogger<[TPrefixFeature]>)._features.push('prefix');

	baseLogger.middlewares.push(prefixMiddleware(prefix));

	return baseLogger as TLogger<[TPrefixFeature, ...GFeatures]>;
}

export function prefixMiddleware(prefix: string): TLoggerMiddleware {
	return (next) => {
		return (logMethod, data) => {
			if (typeof data[0] === 'string') {
				data[0] = `${prefix} ${data[0]}`;
			} else {
				data.unshift(prefix);
			}
			next(logMethod, data);
		};
	};
}
