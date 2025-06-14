import { TDefaultValueFn } from './types';

export function envDefault<GValue>(value: GValue, allowedEnvs: string[]): TDefaultValueFn<GValue> {
	return (env) => {
		if (!allowedEnvs.includes(env?.['NODE_ENV'] as string)) {
			return undefined;
		}
		return value;
	};
}

export function combineDefaults<GValue>(
	...defaults: TDefaultValueFn<GValue>[]
): TDefaultValueFn<GValue> {
	return (env) => {
		for (const defaultFn of defaults) {
			const result = defaultFn(env);
			if (result !== undefined) {
				return result;
			}
		}
		return undefined;
	};
}

export function devDefault<GValue>(value: GValue): TDefaultValueFn<GValue> {
	return envDefault(value, ['development']);
}

export function localDefault<GValue>(value: GValue): TDefaultValueFn<GValue> {
	return envDefault(value, ['local', 'development']);
}

export function testDefault<GValue>(value: GValue): TDefaultValueFn<GValue> {
	return envDefault(value, ['test']);
}

export function ciDefault<GValue>(value: GValue): TDefaultValueFn<GValue> {
	return (env) => {
		if (!env?.['CI']) {
			return undefined;
		}
		return value;
	};
}
