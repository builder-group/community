import { TDefaultValueFn } from './types';

export const devDefault = <GValue>(value: GValue): TDefaultValueFn<GValue> => {
	return (env) => {
		if (env['NODE_ENV'] === 'production') {
			return undefined;
		}
		return value;
	};
};

export const localDefault = <GValue>(value: GValue): TDefaultValueFn<GValue> => {
	return (env) => {
		if (env['NODE_ENV'] !== 'local' && env['NODE_ENV'] !== 'development') {
			return undefined;
		}
		return value;
	};
};

export const testDefault = <GValue>(value: GValue): TDefaultValueFn<GValue> => {
	return (env) => {
		if (env['NODE_ENV'] !== 'test') {
			return undefined;
		}
		return value;
	};
};
