import { TEnforceFeatures, TFeatureKeys, TLogger } from '../types';

export function withPrefix<GSelectedFeatureKeys extends TFeatureKeys[]>(
	logger: TLogger<TEnforceFeatures<GSelectedFeatureKeys, ['base']>>,
	prefix: string
): TLogger<['prefix', ...GSelectedFeatureKeys]> {
	logger._features.push('prefix');

	logger._config.middlewares.push((next) => {
		return (logMethod, data) => {
			next(logMethod, [prefix, ...data]);
		};
	});

	return logger as TLogger<['prefix', ...GSelectedFeatureKeys]>;
}
