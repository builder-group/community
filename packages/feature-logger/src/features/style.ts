import { defineFeature, type TFeature } from 'feature-core';
import type { TLoggerBase, TLoggerMiddleware, TLogMethod } from '../types';

/** Applies browser console CSS styles to string messages based on the log method. */
export function styleFeature(styles: TLogStyles = {}): TStyleFeature {
	return defineFeature<TStyleFeature>({
		key: 'style',
		install(logger: TLoggerBase) {
			logger._middleware.push(styleMiddleware(styles));

			return {};
		}
	});
}

export type TStyleFeature = TFeature<'style', object>;

/** Browser console CSS strings keyed by log method. */
export type TLogStyles = Partial<Record<TLogMethod, string>>;

/** Middleware that inserts `%c` CSS arguments for string messages. */
export function styleMiddleware(styles: TLogStyles = {}): TLoggerMiddleware {
	const allStyles = { ...defaultLogStyles, ...styles };

	return (next) => {
		return (data, context) => {
			const style = allStyles[context.logMethod];
			if (typeof data[0] !== 'string' || style == null) {
				next(data, context);
				return;
			}

			data[0] = `%c${data[0]}`;
			data.splice(1, 0, style);
			next(data, context);
		};
	};
}

/** Default browser console CSS styles used by `styleFeature()`. */
export const defaultLogStyles: TLogStyles = {
	trace: 'color: #aaa',
	debug: 'color: #888',
	log: 'color: #333',
	info: 'color: #0066cc',
	warn: 'color: #f90',
	error: 'color: #f33'
};
