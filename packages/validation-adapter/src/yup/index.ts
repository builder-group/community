import { ValidationError, type Schema } from 'yup';

import { createValidationAdapter, type TValidationAdapter } from '../_adapter';

export function yupValidator<GValue>(schema: Schema<GValue>): TValidationAdapter<GValue> {
	return createValidationAdapter([
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
								message: err.message.replace('this', cx.config.key),
								path: err.path
							});
						}
						for (const innerErr of err.inner) {
							cx.registerError({
								code: innerErr.type ?? 'unknown',
								message: innerErr.message.replace('this', cx.config.key),
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
