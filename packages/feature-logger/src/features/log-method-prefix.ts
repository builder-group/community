import { defineFeature, type TFeature } from 'feature-core';
import type { TLoggerBase, TLoggerMiddleware, TLogMethod } from '../types';
import { prefixMiddleware } from './prefix';

/** Adds the console method name as a capitalized prefix to every log call. */
export function logMethodPrefixFeature(
	options: TLogMethodPrefixFeatureOptions = {}
): TLogMethodPrefixFeature {
	return defineFeature<TLogMethodPrefixFeature>({
		key: 'log-method-prefix',
		install(logger: TLoggerBase) {
			logger._middleware.push(logMethodPrefixMiddleware(options));

			return {};
		}
	});
}

export type TLogMethodPrefixFeature = TFeature<'log-method-prefix', object>;

export interface TLogMethodPrefixFeatureOptions {
	/** Formats the console method before it is used as a prefix. */
	formatLogMethod?: (logMethod: TLogMethod) => string;
}

/** Middleware that prefixes each log call with its console method name. */
export function logMethodPrefixMiddleware(
	options: TLogMethodPrefixFeatureOptions = {}
): TLoggerMiddleware {
	const { formatLogMethod = defaultFormatLogMethod } = options;

	return prefixMiddleware((context) => formatLogMethod(context.logMethod));
}

function defaultFormatLogMethod(logMethod: TLogMethod): string {
	return `${logMethod.charAt(0).toUpperCase()}${logMethod.slice(1)}:`;
}
