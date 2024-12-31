import { TFeatureDefinition, TWithFeatures } from '@blgc/types/features';

export type TLogger<GFeatures extends TFeatureDefinition[]> = TWithFeatures<
	{
		_config: TLoggerConfig;
		_invokeConsole: TInvokeConsole;
		_baseLog: (category: TLoggerCategory, data: unknown[]) => void;
		trace: (message?: unknown, ...optionalParams: unknown[]) => void;
		log: (message?: unknown, ...optionalParams: unknown[]) => void;
		info: (message?: unknown, ...optionalParams: unknown[]) => void;
		warn: (message?: unknown, ...optionalParams: unknown[]) => void;
		error: (message?: unknown, ...optionalParams: unknown[]) => void;
	},
	GFeatures
>;

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
