import { TLoggerCategory } from './logger';

export interface TPrefixFeature {
	key: 'prefix';
	api: {};
}

export interface TTimestampFeature {
	key: 'timestamp';
	api: {};
}

export interface TMethodPrefixFeature {
	key: 'methodPrefix';
	api: {};
}

export interface TLogIdFeature {
	key: 'logId';
	api: {
		_baseLogWithId: (category: TLoggerCategory, data: unknown[]) => string;
		logWithId: (message: unknown, ...optionalParams: unknown[]) => string;
		traceWithId: (message: unknown, ...optionalParams: unknown[]) => string;
		infoWithId: (message: unknown, ...optionalParams: unknown[]) => string;
		warnWithId: (message: unknown, ...optionalParams: unknown[]) => string;
		errorWithId: (message: unknown, ...optionalParams: unknown[]) => string;
	};
}
