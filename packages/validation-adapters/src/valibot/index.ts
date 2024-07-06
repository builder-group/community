import { getDotPath, safeParseAsync, type BaseIssue, type BaseSchema } from 'valibot';
import { createValidationAdapter, type TValidationAdapter } from 'validation-adapter';

export function valibotAdapter<GValue>(
	schema: BaseSchema<GValue, unknown, BaseIssue<unknown>>
): TValidationAdapter<GValue> {
	return createValidationAdapter([
		{
			key: 'valibot',
			validate: async (cx) => {
				const result = await safeParseAsync(schema, cx.value, {
					abortPipeEarly: cx.config.collectErrorMode === 'firstError'
				});

				if (result.issues != null) {
					for (const issue of result.issues) {
						cx.registerError({
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
