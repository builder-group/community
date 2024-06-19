import { ZodError, type Schema } from 'zod';

import { type TFormFieldValidator } from '../../types';
import { createFormFieldValidator } from './create-form-field-validator';

export function createZodFormFieldValidator<GValue>(
	schema: Schema<GValue>
): TFormFieldValidator<GValue> {
	return createFormFieldValidator([
		{
			key: 'zod',
			validate: (formField) => {
				try {
					schema.parse(formField.get());
				} catch (err) {
					if (err instanceof ZodError) {
						for (const issue of err.errors) {
							formField.status.registerError({
								code: issue.code,
								message: issue.message.replace('this', formField.key),
								path: issue.path.join('.')
							});
						}
					}
				}
			}
		}
	]);
}
