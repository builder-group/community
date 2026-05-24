import type { TAnyFeature, TFeatureHost } from 'feature-core';

/** Logger object returned by `createLogger()`. */
export type TLogger<GFeatures extends TAnyFeature[] = []> = TFeatureHost<TLoggerBase, GFeatures>;

/**
 * Core logger API used by feature installers.
 * Use this type when a feature only needs the base methods,
 * regardless of which other features are already installed on the host.
 */
export interface TLoggerBase {
	/** @internal */
	_invokeConsole: TInvokeConsole;
	/** @internal */
	_baseLog(data: unknown[], context: TLogContext): void;
	/** @internal */
	_middleware: TLoggerMiddleware[];
	/** When `false`, all log calls are silenced without removing the logger. */
	active: boolean;
	/** Minimum log level. Calls with a level below this value are suppressed. See `ELogLevel`. */
	level: number;
	/** Emits at `ELogLevel.TRACE`. */
	trace(...data: unknown[]): void;
	/** Emits at `ELogLevel.DEBUG`. */
	debug(...data: unknown[]): void;
	/** Emits at `ELogLevel.LOG`. */
	log(...data: unknown[]): void;
	/** Emits at `ELogLevel.INFO`. */
	info(...data: unknown[]): void;
	/** Emits at `ELogLevel.WARN`. */
	warn(...data: unknown[]): void;
	/** Emits at `ELogLevel.ERROR`. */
	error(...data: unknown[]): void;
}

export type TInvokeConsole = (data: unknown[], context: TLogContext) => void;

export type TLoggerMiddleware = (next: TInvokeConsole) => TInvokeConsole;

export interface TLogContext {
	/** The console method this call maps to. */
	logMethod: TLogMethod;
	/** Numeric log level for this call. Compare against `ELogLevel` values. */
	level: number;
	/** Per-call middleware appended after the logger's own stack for this invocation only. */
	middleware?: TLoggerMiddleware[];
}

export type TLogMethod = 'debug' | 'trace' | 'log' | 'info' | 'warn' | 'error';
