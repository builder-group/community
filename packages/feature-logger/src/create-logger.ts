import { createFeatureHost } from 'feature-core';
import type { TInvokeConsole, TLogger, TLoggerBase, TLoggerMiddleware } from './types';

/**
 * Creates a logger with `trace`, `debug`, `log`, `info`, `warn`, and `error` methods.
 *
 * Set `level` to suppress output below a minimum priority. Set `active` to `false` to
 * silence all output without removing the logger. Pass `invokeConsole` to redirect output
 * or capture it in tests without patching `console`.
 * Extend with features using `.with(feature())`.
 */
export function createLogger(options: TCreateLoggerOptions = {}): TLogger<[]> {
	const { active = true, level = ELogLevel.ALL, middleware = [], invokeConsole } = options;

	return createFeatureHost<TLoggerBase>({
		_invokeConsole: resolveInvokeConsole(invokeConsole),
		active,
		level,
		_middleware: middleware,
		_baseLog(data, context) {
			if (!this.active || context.level < this.level) {
				return;
			}

			const invokeConsoleWithMiddleware = this._middleware
				.concat(context.middleware ?? [])
				.reduceRight((next, middleware) => middleware(next), this._invokeConsole);
			invokeConsoleWithMiddleware(data, context);
		},
		trace(...data) {
			this._baseLog(data, { logMethod: 'trace', level: ELogLevel.TRACE });
		},
		debug(...data) {
			this._baseLog(data, { logMethod: 'debug', level: ELogLevel.DEBUG });
		},
		log(...data) {
			this._baseLog(data, { logMethod: 'log', level: ELogLevel.LOG });
		},
		info(...data) {
			this._baseLog(data, { logMethod: 'info', level: ELogLevel.INFO });
		},
		warn(...data) {
			this._baseLog(data, { logMethod: 'warn', level: ELogLevel.WARN });
		},
		error(...data) {
			this._baseLog(data, { logMethod: 'error', level: ELogLevel.ERROR });
		}
	});
}

export interface TCreateLoggerOptions {
	/** Whether the logger is active. When `false`, all log calls are silenced. Defaults to `true`. */
	active?: boolean;
	/** Minimum log level. Calls below this level are suppressed. Defaults to `ELogLevel.ALL`. */
	level?: number;
	/** Initial middleware stack. Merged with middleware added later via `.with()`. */
	middleware?: TLoggerMiddleware[];
	/** Custom console invoker. Use to redirect output or capture logs in tests. */
	invokeConsole?: TInvokeConsole;
}

/** Numeric severity values used by logger level filtering. Higher values are more severe. */
export enum ELogLevel {
	ALL = 0,
	TRACE = 100,
	DEBUG = 200,
	LOG = 300,
	INFO = 400,
	WARN = 500,
	ERROR = 600
}

function resolveInvokeConsole(invokeConsole: TInvokeConsole | undefined): TInvokeConsole {
	if (invokeConsole != null) {
		return invokeConsole;
	}

	if (typeof console !== 'object') {
		throw new Error('Failed to resolve console object');
	}

	return (data, context) => {
		const { logMethod } = context;
		if (logMethod in console && typeof console[logMethod] === 'function') {
			console[logMethod](...data);
			return;
		}

		throw new Error(`Failed to invoke console.${logMethod}`);
	};
}
