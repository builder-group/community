import { getDotPath, safeParseAsync, type BaseIssue, type BaseSchema } from 'valibot';

import { type TFormFieldValidator } from '../../types';
import { createValidator } from './create-validator';

export function valibotValidator<GValue>(
	schema: BaseSchema<GValue, unknown, BaseIssue<unknown>>
): TFormFieldValidator<GValue> {
	return createValidator([
		{
			key: 'valibot',
			validate: async (formField) => {
				const result = await safeParseAsync(schema, formField.get(), {
					abortPipeEarly: formField._config.collectErrorMode === 'firstError'
				});

				if (result.issues != null) {
					for (const issue of result.issues) {
						formField.status.registerError({
							code: issue.type,
							message: issue.message,
							path: getDotPath(issue) ?? undefined
						});
					}
				}
			}
		}
	]);
}
