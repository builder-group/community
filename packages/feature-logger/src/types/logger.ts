import { type TFeatureKeys, type TSelectFeatures } from './features';

export type TLogger<GSelectedFeatureKeys extends TFeatureKeys[]> = {
	_features: string[];
	_config: TLoggerConfig;
	_invokeConsole: TInvokeConsole;
	_baseLog: (category: TLoggerCategory, data: unknown[]) => void;
	trace: (message?: unknown, ...optionalParams: unknown[]) => void;
	log: (message?: unknown, ...optionalParams: unknown[]) => void;
	info: (message?: unknown, ...optionalParams: unknown[]) => void;
	warn: (message?: unknown, ...optionalParams: unknown[]) => void;
	error: (message?: unknown, ...optionalParams: unknown[]) => void;
} & TSelectFeatures<GSelectedFeatureKeys>;

export interface TLoggerConfig {
	active: boolean;
	level: number;
	middlewares: TLoggerMiddleware[];
}

export type TLoggerOptions = Partial<TLoggerConfig> & {
	invokeConsole?: TInvokeConsole;
};

export type TInvokeConsole = (logMethod: TLogMethod, data: unknown[]) => void;

export type TLoggerMiddleware = (next: TInvokeConsole) => TInvokeConsole;

export interface TLoggerCategory {
	logMethod: TLogMethod;
	level: number;
	middlewares?: TLoggerMiddleware[];
}

export type TLogMethod = 'debug' | 'trace' | 'log' | 'info' | 'warn' | 'error' | 'table';
