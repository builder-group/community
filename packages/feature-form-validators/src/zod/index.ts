import { createValidator, type TFormFieldValidator } from 'feature-form';
import { ZodError, type Schema } from 'zod';

export function zodValidator<GValue>(schema: Schema<GValue>): TFormFieldValidator<GValue> {
	return createValidator([
		{
			key: 'zod',
			validate: (formField) => {
				try {
					schema.parse(formField.get());
				} catch (err) {
					if (isZodError(err)) {
						for (const issue of err.errors) {
							formField.status.registerNextError({
								code: issue.code,
								message: issue.message,
								path: issue.path.join('.')
							});
						}
					} else {
						console.warn(
							'Parse error is not an instance of a ZodError. Ensure Zod is correctly installed.',
							err
						);
					}
				}
			}
		}
	]);
}

export function isZodError(err: unknown): err is ZodError {
	return (
		err instanceof ZodError ||
		(err instanceof Error && 'errors' in err && Array.isArray(err.errors))
	);
}
