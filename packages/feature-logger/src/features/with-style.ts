import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { TLoggerMiddleware, TStyleFeature, type TLogger } from '../types';

const DEFAULT_STYLES: Record<string, string> = {
	trace: 'color: #aaa',
	debug: 'color: #888',
	log: 'color: #333',
	info: 'color: #0066cc',
	warn: 'color: #f90',
	error: 'color: #f33'
};

export function withStyle<GFeatures extends TFeatureDefinition[]>(
	baseLogger: TEnforceFeatureConstraint<TLogger<GFeatures>, TLogger<GFeatures>, []>,
	styles: Record<string, string> = {}
): TLogger<[TStyleFeature, ...GFeatures]> {
	(baseLogger as TLogger<[TStyleFeature]>)._features.push('style');

	baseLogger.middlewares.push(styleMiddleware({ ...DEFAULT_STYLES, ...styles }));

	return baseLogger as TLogger<[TStyleFeature, ...GFeatures]>;
}

export function styleMiddleware(styles: Record<string, string>): TLoggerMiddleware {
	return (next) => {
		return (logMethod, data) => {
			const style = styles[logMethod];
			if (typeof data[0] === 'string' && style) {
				data[0] = `%c${data[0]}`;
				data.splice(1, 0, style);
			}
			next(logMethod, data);
		};
	};
}
