import { getDotPath, safeParseAsync, type BaseIssue, type BaseSchema } from 'valibot';

import { type TFormFieldValidator } from '../../types';
import { createFormFieldValidator } from './create-form-field-validator';

export function createValibotFormFieldValidator<GValue>(
	schema: BaseSchema<GValue, unknown, BaseIssue<unknown>>
): TFormFieldValidator<GValue> {
	return createFormFieldValidator([
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
							message: issue.message.replace('this', formField.key),
							path: getDotPath(issue) ?? undefined
						});
					}
				}
			}
		}
	]);
}
