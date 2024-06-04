// Based on:
// https://github.com/trpc/trpc/blob/main/packages/server/src/core/parser.ts

export interface TParserZodEsque<GResult> {
	parse: (input: unknown) => GResult;
}

export type TParserCustomValidatorEsque<GResult> = (input: unknown) => Promise<GResult> | GResult;

export interface TParserYupEsque<GResult> {
	validateSync: (input: unknown) => GResult;
}

export type TParserEsque<GResult> =
	| TParserCustomValidatorEsque<GResult>
	| TParserZodEsque<GResult>
	| TParserYupEsque<GResult>;

export type TParserSchema<T> = {
	[P in keyof Required<T>]: TParserEsque<T[P]>;
};

export function isTParserZodEsque<GResult>(
	validator: unknown
): validator is TParserZodEsque<GResult> {
	return (
		typeof validator === 'object' &&
		validator != null &&
		'parse' in validator &&
		typeof validator.parse === 'function'
	);
}

export function isTParserCustomValidatorEsque<GResult>(
	validator: unknown
): validator is TParserCustomValidatorEsque<GResult> {
	return validator != null && typeof validator === 'function';
}

export function isTParserYupEsque<GResult>(
	validator: unknown
): validator is TParserYupEsque<GResult> {
	return (
		typeof validator === 'object' &&
		validator != null &&
		'validateSync' in validator &&
		typeof validator.validateSync === 'function'
	);
}
