import { createLogger, ELogLevel, logMethodPrefixFeature, type TLoggerBase } from 'feature-logger';

export const logger: TLoggerBase = createLogger({ level: ELogLevel.INFO }).with(
	logMethodPrefixFeature({
		formatLogMethod: (logMethod) => `[api-shopify-hono/${logMethod.toUpperCase()}]`
	})
);
