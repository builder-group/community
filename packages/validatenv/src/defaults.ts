import type { TEnvDefaultFn } from './types';

/** Tries each default function in order and returns the first non-undefined result. */
export function pipeDefaults<GValue>(
	firstDefault: TEnvDefaultFn<GValue>,
	...defaults: TEnvDefaultFn<GValue>[]
): TEnvDefaultFn<GValue> {
	const allDefaults = [firstDefault, ...defaults];

	return (env) => {
		for (const defaultFn of allDefaults) {
			const result = defaultFn(env);
			if (result !== undefined) {
				return result;
			}
		}
		return undefined;
	};
}

/** Returns value when NODE_ENV in the env source matches one of the allowed values. */
export function envDefault<GValue>(
	value: GValue,
	allowedEnvs: readonly string[]
): TEnvDefaultFn<GValue> {
	return (env) => {
		const nodeEnv = env['NODE_ENV'];
		if (typeof nodeEnv !== 'string' || !allowedEnvs.includes(nodeEnv)) {
			return undefined;
		}
		return value;
	};
}

/** Active when NODE_ENV is "development". */
export function devDefault<GValue>(value: GValue): TEnvDefaultFn<GValue> {
	return envDefault(value, ['development']);
}

/** Active when NODE_ENV is "local" or "development". */
export function localDefault<GValue>(value: GValue): TEnvDefaultFn<GValue> {
	return envDefault(value, ['local', 'development']);
}

/** Active when NODE_ENV is "test". */
export function testDefault<GValue>(value: GValue): TEnvDefaultFn<GValue> {
	return envDefault(value, ['test']);
}

/** Active when the CI environment variable is set to a truthy value. */
export function ciDefault<GValue>(value: GValue): TEnvDefaultFn<GValue> {
	return (env) => {
		if (!env['CI']) {
			return undefined;
		}
		return value;
	};
}
