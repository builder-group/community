import { TLoggerCategory } from './logger';

export interface TPrefixFeature {
	key: 'prefix';
	api: {};
}

export interface TTimestampFeature {
	key: 'timestamp-prefix';
	api: {};
}

export interface TMethodPrefixFeature {
	key: 'log-method-prefix';
	api: {};
}

export interface TStyleFeature {
	key: 'style';
	api: {};
}

export interface TLogIdFeature {
	key: 'log-id';
	api: {
		_baseLogWithId: (category: TLoggerCategory, data: unknown[]) => string;
		traceWithId: (message: unknown, ...optionalParams: unknown[]) => string;
		debugWithId: (message: unknown, ...optionalParams: unknown[]) => string;
		logWithId: (message: unknown, ...optionalParams: unknown[]) => string;
		infoWithId: (message: unknown, ...optionalParams: unknown[]) => string;
		warnWithId: (message: unknown, ...optionalParams: unknown[]) => string;
		errorWithId: (message: unknown, ...optionalParams: unknown[]) => string;
	};
}
