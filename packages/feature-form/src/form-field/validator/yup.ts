import { ValidationError, type Schema } from 'yup';

import { type TFormFieldValidator } from '../../types';
import { createValidator } from './create-validator';

export function yupValidator<GValue>(schema: Schema<GValue>): TFormFieldValidator<GValue> {
	return createValidator([
		{
			key: 'yup',
			validate: async (formField) => {
				try {
					await schema.validate(formField.get(), {
						abortEarly: formField._config.collectErrorMode === 'firstError'
					});
				} catch (err) {
					if (isYupError(err)) {
						if (err.inner.length === 0) {
							formField.status.registerNextError({
								code: err.type ?? 'unknown',
								message: err.message.replace('this', formField.key),
								path: err.path
							});
						}
						for (const innerErr of err.inner) {
							formField.status.registerNextError({
								code: innerErr.type ?? 'unknown',
								message: innerErr.message.replace('this', formField.key),
								path: innerErr.path
							});
						}
					} else {
						console.warn(
							'Parse error is not an instance of a ValidationError. Ensure Yup is correctly installed.',
							err
						);
					}
				}
			}
		}
	]);
}

export function isYupError(err: unknown): err is ValidationError {
	return (
		err instanceof ValidationError ||
		(err instanceof Error && 'inner' in err && Array.isArray(err.inner))
	);
}
