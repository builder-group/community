import { createValidator, type TValidator } from 'validation-adapter';
import { ZodError, type ZodType } from 'zod';

export { zodValidator as zValidator };

export function zodValidator<GValue>(schema: ZodType<GValue>): TValidator<GValue> {
	return createValidator([
		{
			key: 'zod',
			validate: (cx) => {
				try {
					schema.parse(cx.value);
				} catch (err) {
					if (isZodError(err)) {
						if (err.issues.length > 0) {
							const errorCount =
								cx.config.collectErrorMode === 'firstError' ? 1 : err.issues.length;
							for (let i = 0; i < errorCount; i++) {
								// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Can't be null
								const { code, message, path } = err.issues[i]!;
								cx.registerError({
									code: code,
									message,
									path: path.join('.')
								});
							}
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
		(err instanceof Error && 'issues' in err && Array.isArray(err.issues))
	);
}
