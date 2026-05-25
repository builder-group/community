import { defineFeature, type TFeature } from 'feature-core';
import type { TLoggerBase, TLoggerMiddleware } from '../types';
import { prefixMiddleware } from './prefix';

/** Adds the current local timestamp as a prefix to every log call. */
export function timestampPrefixFeature(
	options: TTimestampPrefixFeatureOptions = {}
): TTimestampPrefixFeature {
	return defineFeature<TTimestampPrefixFeature>({
		key: 'timestamp-prefix',
		install(logger: TLoggerBase) {
			logger._middleware.push(timestampPrefixMiddleware(options));

			return {};
		}
	});
}

export type TTimestampPrefixFeature = TFeature<'timestamp-prefix', object>;

export interface TTimestampPrefixFeatureOptions {
	formatTimestamp?: (date: Date) => string;
}

export function timestampPrefixMiddleware(
	options: TTimestampPrefixFeatureOptions = {}
): TLoggerMiddleware {
	const { formatTimestamp = defaultFormatTimestamp } = options;

	return prefixMiddleware(() => formatTimestamp(new Date(Date.now())));
}

function defaultFormatTimestamp(date: Date): string {
	return `[${date.toLocaleString()}]`;
}
