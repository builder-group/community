import { getDotPath, safeParseAsync, type BaseIssue, type BaseSchema } from 'valibot';
import { createValidator, type TValidator } from 'validation-adapter';

export { valibotValidator as vValidator };

export function valibotValidator<GValue>(
	schema: BaseSchema<GValue, unknown, BaseIssue<unknown>>
): TValidator<GValue> {
	return createValidator([
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
