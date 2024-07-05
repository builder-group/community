import { ZodError, type Schema } from 'zod';

import { createValidationAdapter, type TValidationAdapter } from '../_adapter';

export function zodValidator<GValue>(schema: Schema<GValue>): TValidationAdapter<GValue> {
	return createValidationAdapter([
		{
			key: 'zod',
			validate: (cx) => {
				try {
					schema.parse(cx.value);
				} catch (err) {
					if (isZodError(err)) {
						for (const issue of err.errors) {
							cx.registerError({
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
