import { defineFeature, type TFeature } from 'feature-core';
import type { TLogContext, TLoggerBase, TLoggerMiddleware } from '../types';

/**
 * Adds a static prefix to every log call.
 *
 * `newLineBehavior` controls multiline string messages: `'indent'` prefixes the first
 * line and indents the rest (default), `'prefix'` prefixes every line, `'ignore'`
 * prepends the prefix once without considering newlines.
 */
export function prefixFeature(prefix: string, options: TPrefixFeatureOptions = {}): TPrefixFeature {
	return defineFeature<TPrefixFeature>({
		key: 'prefix',
		install(logger: TLoggerBase) {
			logger._middleware.push(prefixMiddleware(prefix, options));

			return {};
		}
	});
}

export type TPrefixFeature = TFeature<'prefix', object>;

export interface TPrefixFeatureOptions {
	/**
	 * Controls how multiline string messages are handled.
	 * `'indent'` prefixes the first line and indents following lines (default).
	 * `'prefix'` prefixes every line.
	 * `'ignore'` treats the message as one string and prefixes it once.
	 */
	newLineBehavior?: 'indent' | 'prefix' | 'ignore';
}

export function prefixMiddleware(
	prefix: string | TLogPrefixResolver,
	options: TPrefixFeatureOptions = {}
): TLoggerMiddleware {
	const { newLineBehavior = 'indent' } = options;

	return (next) => {
		return (data, context) => {
			const resolvedPrefix = typeof prefix === 'function' ? prefix(context) : prefix;
			if (typeof data[0] !== 'string') {
				data.unshift(resolvedPrefix);
				next(data, context);
				return;
			}

			switch (newLineBehavior) {
				case 'indent':
					data[0] = formatIndentedPrefixMessage(resolvedPrefix, data[0]);
					next(data, context);
					return;
				case 'prefix':
					data[0] = formatPrefixedLines(resolvedPrefix, data[0]);
					next(data, context);
					return;
				case 'ignore':
					data[0] = `${resolvedPrefix} ${data[0]}`;
					next(data, context);
					return;
			}
		};
	};
}

export type TLogPrefixResolver = (context: TLogContext) => string;

function formatIndentedPrefixMessage(prefix: string, message: string): string {
	const lines = message.split('\n');
	const indentation = ' '.repeat(prefix.length + 1);

	return lines
		.map((line, index) => {
			if (index === 0) {
				return `${prefix} ${line}`;
			}

			return `${indentation}${line}`;
		})
		.join('\n');
}

function formatPrefixedLines(prefix: string, message: string): string {
	return message
		.split('\n')
		.map((line) => `${prefix} ${line}`)
		.join('\n');
}
