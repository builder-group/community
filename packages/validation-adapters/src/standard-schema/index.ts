import type { StandardSchemaV1 } from '@standard-schema/spec';
import { createValidator, type TValidator } from 'validation-adapter';

export { standardSchemaValidator as sValidator };

export function standardSchemaValidator<GValue>(
	schema: StandardSchemaV1<unknown, GValue>
): TValidator<GValue> {
	return createValidator([
		{
			key: 'standard-schema',
			validate: async (cx) => {
				try {
					const result = schema['~standard'].validate(cx.value);
					const resolvedResult = result instanceof Promise ? await result : result;

					if (resolvedResult.issues != null) {
						const issues = resolvedResult.issues;
						const errorCount = cx.config.collectErrorMode === 'firstError' ? 1 : issues.length;

						for (let i = 0; i < errorCount; i++) {
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Can't be null
							const issue = issues[i]!;
							const path =
								issue.path?.map((segment) =>
									typeof segment === 'object' && 'key' in segment ? segment.key : segment
								) || [];

							cx.registerError({
								code: 'validation_error',
								message: issue.message,
								path: path.join('.')
							});
						}
					}
				} catch (err) {
					console.warn(
						'Standard Schema validation error. Ensure the schema is correctly implemented.',
						err
					);
					cx.registerError({
						code: 'standard_schema_error',
						message: 'Standard Schema validation failed'
					});
				}
			}
		}
	]);
}

export function isStandardSchema(schema: unknown): schema is StandardSchemaV1 {
	return (
		schema != null &&
		typeof schema === 'object' &&
		'~standard' in schema &&
		schema['~standard'] != null &&
		typeof schema['~standard'] === 'object' &&
		'version' in schema['~standard'] &&
		'vendor' in schema['~standard'] &&
		'validate' in schema['~standard'] &&
		typeof schema['~standard'].validate === 'function'
	);
}
