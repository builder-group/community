import type { Schema } from 'zod';

import { type TFormFieldValidator } from '../../types';
import { createFormFieldValidator } from './create-form-field-validator';

export function createZodFormFieldValidator<GValue>(
	schema: Schema<GValue>
): TFormFieldValidator<GValue> {
	return createFormFieldValidator([
		{
			key: 'zod',
			validate: async (formField) => {
				try {
					schema.parse(formField.get());
				} catch (err) {
					if (
						err instanceof Error &&
						err.name === 'ZodError' &&
						'errors' in err &&
						Array.isArray(err.errors)
					) {
						if (err.errors.length === 0) {
							formField.status.registerError({
								type: 'zod',
								message: err.message.replace('this', formField.key)
							});
						}
						for (const innerErr of err.errors) {
							formField.status.registerError({
								type: 'zod',
								message: innerErr.message.replace('this', formField.key)
							});
						}
					}
				}
			}
		}
	]);
}
