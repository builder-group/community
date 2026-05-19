import {
	type TForm,
	type TFormData,
	type TFormField,
	type TFormFieldValidationContext,
	type TFormValidationContext,
	type TValidationError,
	type TValidationStatusValue
} from './types';

export function createFormValidationRunContext<GFormData extends TFormData>(
	form: TForm<GFormData>
): TValidationRunContext<TFormValidationContext<GFormData>> {
	const collector = createValidationCollector();

	return {
		collector,
		context: createFormValidationContext(form, collector)
	};
}

function createFormValidationContext<GFormData extends TFormData>(
	form: TForm<GFormData>,
	collector: TValidationCollector
): TFormValidationContext<GFormData> {
	if (form._validation == null) {
		throw new Error('Cannot create a form validation context without form validation.');
	}

	return {
		config: {
			collectErrorMode: form._validation.config.collectErrorMode,
			name: 'form'
		},
		value: form.getData(),
		isValue(_value): _value is GFormData {
			// Note: The context value comes from typed form fields, so no runtime narrowing is needed
			return true;
		},
		hasError() {
			return collector.hasError();
		},
		registerError(error) {
			collector.registerError({
				code: error.code,
				message: error.message,
				path: error.path
			});
		}
	};
}

export function createFormFieldValidationRunContext<GValue>(
	formField: TFormField<GValue>
): TValidationRunContext<TFormFieldValidationContext<GValue>> {
	const collector = createValidationCollector();

	return {
		collector,
		context: createFormFieldValidationContext(formField, collector)
	};
}

function createFormFieldValidationContext<GValue>(
	formField: TFormField<GValue>,
	collector: TValidationCollector
): TFormFieldValidationContext<GValue> {
	if (formField._validation == null) {
		throw new Error('Cannot create a form field validation context without field validation.');
	}

	return {
		config: {
			collectErrorMode: formField._validation.config.collectErrorMode,
			name: formField.key
		},
		value: formField.get() as Readonly<GValue>,
		isValue(_value): _value is GValue {
			// Note: The context value comes from the typed field state, so no runtime narrowing is needed
			return true;
		},
		hasError() {
			return collector.hasError();
		},
		registerError(error) {
			collector.registerError({
				code: error.code,
				message: error.message,
				path: error.path
			});
		}
	};
}

interface TValidationRunContext<GContext> {
	collector: TValidationCollector;
	context: GContext;
}

function createValidationCollector(): TValidationCollector {
	let value: TValidationStatusValue | undefined;

	return {
		get value() {
			return value;
		},
		hasError() {
			return value?.type === 'invalid';
		},
		registerError(error) {
			value = appendValidationError(value, error);
		}
	};
}

interface TValidationCollector {
	readonly value?: TValidationStatusValue;
	hasError: () => boolean;
	registerError: (error: TValidationError) => void;
}

function appendValidationError(
	status: TValidationStatusValue | undefined,
	error: TValidationError
): TValidationStatusValue {
	if (status?.type === 'invalid') {
		return {
			type: 'invalid',
			errors: [...status.errors, error]
		};
	}

	return { type: 'invalid', errors: [error] };
}
