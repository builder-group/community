import { TLoggerMiddleware, type TInvokeConsole, type TLogger, type TLogMethod } from './types';

export function createLogger(options: TCreateLoggerOptions = {}): TLogger<[]> {
	const { active = true, level = 0, middlewares = [] } = options;

	let invokeConsole: TInvokeConsole;
	if (typeof options.invokeConsole === 'function') {
		invokeConsole = options.invokeConsole;
	} else if (typeof console === 'object') {
		invokeConsole = defaultInvokeConsole;
	} else {
		throw Error(`Failed to invoke console object!`);
	}

	return {
		_features: [],
		active,
		level,
		middlewares,
		_invokeConsole: invokeConsole,
		_baseLog(category, data) {
			if (this.active && category.level >= this.level) {
				this.middlewares
					.concat(category.middlewares ?? [])
					.reduceRight((acc, middleware) => middleware(acc), invokeConsole)(
					category.logMethod,
					data
				);
			}
		},
		trace(message, ...optionalParams) {
			this._baseLog({ logMethod: 'trace', level: LOG_LEVEL.TRACE }, [message, ...optionalParams]);
		},
		debug(message, ...optionalParams) {
			this._baseLog({ logMethod: 'debug', level: LOG_LEVEL.DEBUG }, [message, ...optionalParams]);
		},
		log(message, ...optionalParams) {
			this._baseLog({ logMethod: 'log', level: LOG_LEVEL.LOG }, [message, ...optionalParams]);
		},
		info(message, ...optionalParams) {
			this._baseLog({ logMethod: 'info', level: LOG_LEVEL.INFO }, [message, ...optionalParams]);
		},
		warn(message, ...optionalParams) {
			this._baseLog({ logMethod: 'warn', level: LOG_LEVEL.WARN }, [message, ...optionalParams]);
		},
		error(message, ...optionalParams) {
			this._baseLog({ logMethod: 'error', level: LOG_LEVEL.ERROR }, [message, ...optionalParams]);
		}
	};
}

export interface TCreateLoggerOptions {
	active?: boolean;
	level?: number;
	middlewares?: TLoggerMiddleware[];
	invokeConsole?: TInvokeConsole;
}

function defaultInvokeConsole(logMethod: TLogMethod, data: unknown[]): void {
	if (logMethod in console && typeof console[logMethod] === 'function') {
		// @ts-expect-error -- We verify that the method exists in the console object
		console[logMethod](...data);
	} else {
		throw Error(`Failed to invoke console.${logMethod}!`);
	}
}

export enum LOG_LEVEL {
	TRACE = 4,
	DEBUG = 8,
	LOG = 16,
	INFO = 32,
	WARN = 64,
	ERROR = 128
}
