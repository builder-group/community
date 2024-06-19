import { ValidationError, type Schema } from 'yup';

import { type TFormFieldValidator } from '../../types';
import { createFormFieldValidator } from './create-form-field-validator';

export function createYupFormFieldValidator<GValue>(
	schema: Schema<GValue>
): TFormFieldValidator<GValue> {
	return createFormFieldValidator([
		{
			key: 'yup',
			validate: async (formField) => {
				try {
					await schema.validate(formField.get(), {
						abortEarly: formField._config.collectErrorMode === 'firstError'
					});
				} catch (err) {
					if (err instanceof ValidationError) {
						if (err.inner.length === 0) {
							formField.status.registerError({
								code: err.type ?? 'unknown',
								message: err.message.replace('this', formField.key),
								path: err.path
							});
						}
						for (const innerErr of err.inner) {
							formField.status.registerError({
								code: innerErr.type ?? 'unknown',
								message: innerErr.message.replace('this', formField.key),
								path: innerErr.path
							});
						}
					}
				}
			}
		}
	]);
}
