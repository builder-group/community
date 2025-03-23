import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { TLoggerMiddleware, TMethodPrefixFeature, type TLogger } from '../types';

export function withLogMethodPrefix<GFeatures extends TFeatureDefinition[]>(
	baseLogger: TEnforceFeatureConstraint<TLogger<GFeatures>, TLogger<GFeatures>, []>
): TLogger<[TMethodPrefixFeature, ...GFeatures]> {
	(baseLogger as TLogger<[TMethodPrefixFeature]>)._features.push('log-method-prefix');

	baseLogger.middlewares.push(logMethodPrefixMiddleware());

	return baseLogger as TLogger<[TMethodPrefixFeature, ...GFeatures]>;
}

export function logMethodPrefixMiddleware(): TLoggerMiddleware {
	return (next) => {
		return (logMethod, data) => {
			const prefix = `${logMethod.charAt(0).toUpperCase() + logMethod.slice(1)}:`;
			if (typeof data[0] === 'string') {
				data[0] = `${prefix} ${data[0]}`;
			} else {
				data.unshift(prefix);
			}
			next(logMethod, data);
		};
	};
}
