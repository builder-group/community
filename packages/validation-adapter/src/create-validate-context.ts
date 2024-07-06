import {
	type TBaseValidateContext,
	type TValidateContextConfig,
	type TValidationError
} from './types';

export function createValidateContext<GValue>(
	value: GValue,
	options: TCreateValidationAdapterOptions = {}
): TDefaultValidateContext<GValue> {
	const { collectErrorMode = 'firstError', name } = options;
	return {
		config: {
			collectErrorMode,
			name
		},
		value,
		errors: [],
		hasError(this) {
			return this.errors.length > 0;
		},
		registerError(this, error) {
			this.errors.push(error);
		}
	};
}

interface TDefaultValidateContext<GValue> extends TBaseValidateContext<GValue> {
	errors: TValidationError[];
}

export type TCreateValidationAdapterOptions = Partial<TValidateContextConfig>;
