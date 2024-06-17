import { TInvokeConsole, TLogger, TLoggerOptions, TLogMethod } from './types';

export function createLogger(options: TLoggerOptions = {}): TLogger<['base']> {
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
		_: null,
		_features: ['base'],
		_config: {
			active,
			level,
			middlewares
		},
		_invokeConsole: invokeConsole,
		_baseLog(category, data) {
			if (this._config.active && category.level >= this._config.level) {
				this._config.middlewares
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

function defaultInvokeConsole(logMethod: TLogMethod, data: unknown[]): void {
	if (logMethod in console && typeof console[logMethod] === 'function') {
		// @ts-expect-error
		console[logMethod](...data);
	} else {
		throw Error(`Failed to invoke console.${logMethod}!`);
	}
}

export enum LOG_LEVEL {
	TRACE = 2,
	LOG = 5,
	INFO = 10,
	WARN = 20,
	ERROR = 50
}
