import { defineFeature, type TFeature } from 'feature-core';
import { ELogLevel } from '../create-logger';
import type { TLogContext, TLoggerBase, TLogMethod } from '../types';

/** Adds id prefixes to log calls and makes each log method return the generated id. */
export function logIdFeature(options: TLogIdFeatureOptions = {}): TLogIdFeature {
	const { generateId = defaultGenerateLogId, formatId = defaultFormatLogId } = options;

	return defineFeature<TLogIdFeature>({
		key: 'log-id',
		overrides: ['trace', 'debug', 'log', 'info', 'warn', 'error'],
		install() {
			return {
				_baseLogWithId(this: TLoggerBase, data, context) {
					const id = generateId();
					const formattedId = formatId(id, context);
					if (typeof data[0] === 'string') {
						data[0] = `${formattedId} ${data[0]}`;
					} else {
						data.unshift(formattedId);
					}

					this._baseLog(data, context);

					return id;
				},
				trace(this: TLoggerBase & TLogIdFeatureApi, ...data) {
					return this._baseLogWithId(data, { logMethod: 'trace', level: ELogLevel.TRACE });
				},
				debug(this: TLoggerBase & TLogIdFeatureApi, ...data) {
					return this._baseLogWithId(data, { logMethod: 'debug', level: ELogLevel.DEBUG });
				},
				log(this: TLoggerBase & TLogIdFeatureApi, ...data) {
					return this._baseLogWithId(data, { logMethod: 'log', level: ELogLevel.LOG });
				},
				info(this: TLoggerBase & TLogIdFeatureApi, ...data) {
					return this._baseLogWithId(data, { logMethod: 'info', level: ELogLevel.INFO });
				},
				warn(this: TLoggerBase & TLogIdFeatureApi, ...data) {
					return this._baseLogWithId(data, { logMethod: 'warn', level: ELogLevel.WARN });
				},
				error(this: TLoggerBase & TLogIdFeatureApi, ...data) {
					return this._baseLogWithId(data, { logMethod: 'error', level: ELogLevel.ERROR });
				}
			};
		}
	});
}

export type TLogIdFeature = TFeature<'log-id', TLogIdFeatureApi, [], TLogMethod>;

/** Logger API after `logIdFeature()` makes each log method return the generated id. */
export interface TLogIdFeatureApi {
	/** @internal */
	_baseLogWithId(data: unknown[], context: TLogContext): string;
	trace(...data: unknown[]): string;
	debug(...data: unknown[]): string;
	log(...data: unknown[]): string;
	info(...data: unknown[]): string;
	warn(...data: unknown[]): string;
	error(...data: unknown[]): string;
}

export interface TLogIdFeatureOptions {
	/** Generates a unique id for each log call. Defaults to a 16-character hex string. */
	generateId?: () => string;
	/** Formats the id before prepending it to the message. Defaults to `[id]`. */
	formatId?: (id: string, context: TLogContext) => string;
}

function defaultFormatLogId(id: string): string {
	return `[${id}]`;
}

function defaultGenerateLogId(): string {
	return 'xxxxxxxxxxxxxxxx'.replace(/x/g, () => {
		return ((Math.random() * 16) | 0).toString(16);
	});
}
