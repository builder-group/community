import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { TLoggerMiddleware, TPrefixFeature, type TLogger } from '../types';

export function withPrefix<GFeatures extends TFeatureDefinition[]>(
	baseLogger: TEnforceFeatureConstraint<TLogger<GFeatures>, TLogger<GFeatures>, []>,
	prefix: string,
	options: TPrefixMiddlewareOptions = {}
): TLogger<[TPrefixFeature, ...GFeatures]> {
	(baseLogger as TLogger<[TPrefixFeature]>)._features.push('prefix');

	baseLogger.middlewares.push(prefixMiddleware(prefix, options));

	return baseLogger as TLogger<[TPrefixFeature, ...GFeatures]>;
}

export function prefixMiddleware(
	prefix: string,
	options: TPrefixMiddlewareOptions = {}
): TLoggerMiddleware {
	const { newLineBehavior = 'indent' } = options;

	return (next) => {
		return (logMethod, data) => {
			if (typeof data[0] === 'string') {
				const message = data[0];

				switch (newLineBehavior) {
					case 'indent': {
						const lines = message.split('\n');
						const indentation = ' '.repeat(prefix.length + 1);
						const formattedMessage = lines
							.map((line, index) => {
								if (index === 0) return `${prefix} ${line}`;
								return `${indentation}${line}`;
							})
							.join('\n');
						data[0] = formattedMessage;
						break;
					}
					case 'prefix': {
						const lines = message.split('\n');
						data[0] = lines.map((line) => `${prefix} ${line}`).join('\n');
						break;
					}
					case 'ignore': {
						data[0] = `${prefix} ${message}`;
						break;
					}
				}
			} else {
				data.unshift(prefix);
			}
			next(logMethod, data);
		};
	};
}

export type TPrefixMiddlewareOptions = {
	newLineBehavior?: 'indent' | 'prefix' | 'ignore';
};
