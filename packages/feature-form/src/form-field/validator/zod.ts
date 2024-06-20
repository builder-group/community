import { ZodError, type Schema } from 'zod';

import { type TFormFieldValidator } from '../../types';
import { createValidator } from './create-validator';

export function zodValidator<GValue>(schema: Schema<GValue>): TFormFieldValidator<GValue> {
	return createValidator([
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
								message: issue.message,
								path: issue.path.join('.')
							});
						}
					}
				}
			}
		}
	]);
}
