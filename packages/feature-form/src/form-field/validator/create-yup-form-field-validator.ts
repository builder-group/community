import type { Schema } from 'yup';

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
					await schema.validate(formField.get());
				} catch (err) {
					if (
						err instanceof Error &&
						err.name === 'ValidationError' &&
						'inner' in err &&
						Array.isArray(err.inner)
					) {
						if (err.inner.length === 0) {
							formField.status.registerError({
								type: 'yup',
								message: err.message.replace('this', formField.key)
							});
						}
						for (const innerErr of err.inner) {
							formField.status.registerError({
								type: 'yup',
								message: innerErr.message.replace('this', formField.key)
							});
						}
					}
				}
			}
		}
	]);
}
