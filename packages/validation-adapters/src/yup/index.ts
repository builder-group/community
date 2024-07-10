import { createValidator, type TValidator } from 'validation-adapter';
import { ValidationError, type Schema } from 'yup';

export { yupValidator as yValidator };

export function yupValidator<GValue>(schema: Schema<GValue>): TValidator<GValue> {
	return createValidator([
		{
			key: 'yup',
			validate: async (cx) => {
				try {
					await schema.validate(cx.value, {
						abortEarly: cx.config.collectErrorMode === 'firstError'
					});
				} catch (err) {
					if (isYupError(err)) {
						if (err.inner.length === 0) {
							cx.registerError({
								code: err.type ?? 'unknown',
								message:
									cx.config.name != null
										? err.message.replace('this', cx.config.name)
										: err.message,
								path: err.path
							});
						}
						for (const innerErr of err.inner) {
							cx.registerError({
								code: innerErr.type ?? 'unknown',
								message:
									cx.config.name != null
										? innerErr.message.replace('this', cx.config.name)
										: innerErr.message,
								path: innerErr.path
							});
						}
					} else {
						console.warn(
							'Parse error is not an instance of a ValidationError. Ensure Yup is correctly installed.',
							err
						);
					}
				}
			}
		}
	]);
}

export function isYupError(err: unknown): err is ValidationError {
	return (
		err instanceof ValidationError ||
		(err instanceof Error && 'inner' in err && Array.isArray(err.inner))
	);
}
