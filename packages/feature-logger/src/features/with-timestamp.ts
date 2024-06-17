import { TEnforceFeatures, TFeatureKeys, TLogger } from '../types';

export function withTimestamp<GSelectedFeatureKeys extends TFeatureKeys[]>(
	logger: TLogger<TEnforceFeatures<GSelectedFeatureKeys, ['base']>>
): TLogger<['timestamp', ...GSelectedFeatureKeys]> {
	logger._features.push('timestamp');

	logger._config.middlewares.push((next) => {
		return (logMethod, data) => {
			next(logMethod, [`[${new Date(Date.now()).toLocaleString()}]`, ...data]);
		};
	});

	return logger;
}
