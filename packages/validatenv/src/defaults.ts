import { TDefaultValueFn } from './types';

export const envDefault = <GValue>(
	value: GValue,
	allowedEnvs: string[]
): TDefaultValueFn<GValue> => {
	return (env) => {
		if (!allowedEnvs.includes(env['NODE_ENV'] as string)) {
			return undefined;
		}
		return value;
	};
};

export const devDefault = <GValue>(value: GValue): TDefaultValueFn<GValue> =>
	envDefault(value, ['development']);

export const localDefault = <GValue>(value: GValue): TDefaultValueFn<GValue> =>
	envDefault(value, ['local', 'development']);

export const testDefault = <GValue>(value: GValue): TDefaultValueFn<GValue> =>
	envDefault(value, ['test']);

export const ciDefault = <GValue>(value: GValue): TDefaultValueFn<GValue> =>
	envDefault(value, ['ci']);
