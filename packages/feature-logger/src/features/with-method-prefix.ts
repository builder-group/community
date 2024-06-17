import { hasFeatures } from '../has-features';
import { TEnforceFeatures, TFeatureKeys, TLogger } from '../types';

export function withMethodPrefix<GSelectedFeatureKeys extends TFeatureKeys[]>(
	logger: TLogger<TEnforceFeatures<GSelectedFeatureKeys, ['base']>>
): TLogger<['methodPrefix', ...GSelectedFeatureKeys]> {
	logger._features.push('methodPrefix');
	const withTimestamp = hasFeatures(logger, ['timestamp']);

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

	return logger;
}
