export function toFunction(jsonFunction: TJsonFunction): Function {
	// eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func -- .
	return new Function(...jsonFunction.args, jsonFunction.body);
}

export interface TJsonFunction<GArgs extends string[] = string[]> {
	args: GArgs;
	body: string;
	env?: TJsonFunctionEnv;
}

export type TJsonFunctionEnv = 'INLINE' | 'SANDBOX';

// JavaScript keywords and built-ins whitelist
const KEYWORDS_AND_BUILTINS_WHITELIST = new Set([
	'const',
	'let',
	'return',
	'if',
	'else',
	'for',
	'while',
	'do',
	'switch',
	'case',
	'default',
	'break',
	'continue',
	'throw',
	'try',
	'catch',
	'finally',
	'new',
	'delete',
	'null',
	'true',
	'false',
	'undefined'
]);

export function getJsonFunctionExecutionEnv(jsonFunction: TJsonFunction): TJsonFunctionEnv {
	const { args, body, env } = jsonFunction;

	if (env === 'SANDBOX' || body.length > 500) {
		return 'SANDBOX';
	}

	// Extract all identifiers from the body
	const identifierRegex = /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g;
	const identifiers = body.match(identifierRegex) || [];

	for (const identifier of identifiers) {
		if (!KEYWORDS_AND_BUILTINS_WHITELIST.has(identifier) && !args.includes(identifier)) {
			return 'SANDBOX';
		}
	}

	return 'INLINE';
}
