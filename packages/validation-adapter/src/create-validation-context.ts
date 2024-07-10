import {
	type TBaseValidationContext,
	type TValidationContextConfig,
	type TValidationError
} from './types';

export function createValidationContext<GValue>(
	value: GValue,
	options: TCreateValidationContextOptions = {}
): TDefaultValidationContext<GValue> {
	const { collectErrorMode = 'firstError', name } = options;
	return {
		config: {
			collectErrorMode,
			name
		},
		value: value as Readonly<GValue>,
		errors: [],
		isValue: (v): v is GValue => {
			return true;
		},
		hasError(this) {
			return this.errors.length > 0;
		},
		registerError(this, error) {
			this.errors.push(error);
		}
	};
}

interface TDefaultValidationContext<GValue> extends TBaseValidationContext<GValue> {
	errors: TValidationError[];
}

export type TCreateValidationContextOptions = Partial<TValidationContextConfig>;
