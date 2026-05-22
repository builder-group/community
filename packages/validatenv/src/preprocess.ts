import type { TEnvPreprocess } from './types';

/** Chains preprocess functions in order. Returns undefined early if any step returns undefined. */
export function pipePreprocess<GValue>(
	firstPreprocess: TEnvPreprocess<GValue>,
	...preprocesses: TEnvPreprocess<GValue>[]
): TEnvPreprocess<GValue> {
	const allPreprocesses = [firstPreprocess, ...preprocesses];

	return (value) => {
		let nextValue: unknown = value;

		for (const preprocess of allPreprocesses) {
			nextValue = preprocess(nextValue);
			if (nextValue === undefined) {
				return undefined;
			}
		}

		return nextValue as GValue;
	};
}

/** Treats blank strings and nullish values as undefined. Throws for non-string, non-nullish values. */
export function emptyStringAsUndefined(value: unknown): string | undefined {
	if (value == null) {
		return undefined;
	}

	if (typeof value !== 'string') {
		throw new Error('Expected a string value.');
	}

	return value.trim() === '' ? undefined : value;
}

/** Removes one trailing slash from string values. Throws for non-string, non-nullish values. */
export function stripTrailingSlash(value: unknown): string | undefined {
	if (value == null) {
		return undefined;
	}

	if (typeof value !== 'string') {
		throw new Error('Expected a string value.');
	}

	return value.endsWith('/') ? value.slice(0, -1) : value;
}
