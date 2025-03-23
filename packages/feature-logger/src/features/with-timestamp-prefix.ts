import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { TLoggerMiddleware, TTimestampFeature, type TLogger } from '../types';

export function withTimestamp<GFeatures extends TFeatureDefinition[]>(
	baseLogger: TEnforceFeatureConstraint<TLogger<GFeatures>, TLogger<GFeatures>, []>
): TLogger<[TTimestampFeature, ...GFeatures]> {
	(baseLogger as TLogger<[TTimestampFeature]>)._features.push('timestamp-prefix');

	baseLogger.middlewares.push(timestampPrefixMiddleware());

	return baseLogger as TLogger<[TTimestampFeature, ...GFeatures]>;
}

export function timestampPrefixMiddleware(): TLoggerMiddleware {
	return (next) => {
		return (logMethod, data) => {
			const timestamp = new Date(Date.now()).toLocaleString();
			if (typeof data[0] === 'string') {
				data[0] = `[${timestamp}] ${data[0]}`;
			} else {
				data.unshift(`[${timestamp}]`);
			}
			next(logMethod, data);
		};
	};
}
