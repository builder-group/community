import { Err, Ok, TResult } from '@blgc/utils';
import { createValidationContext } from '../create-validation-context';
import { TValidationError, TValidator } from '../types';

/**
 * Validates a record of values against their corresponding validators
 * @param validators Record of field validators
 * @param data Record of field values to validate
 * @returns Result containing either the validated data or validation errors
 */
export async function validateRecord<GValidators extends Record<string, TValidator<any>>>(
	validators: GValidators,
	data: Partial<TValidatorValueMap<GValidators>>
): Promise<TResult<TValidatorValueMap<GValidators>, TValidationRecordError<keyof GValidators>>> {
	const errors: TValidationRecordError<keyof GValidators> = [];

	for (const key in validators) {
		const validator = validators[key];
		const value = data[key];
		const context = createValidationContext(value);
		await validator?.validate(context);

		if (context.hasError()) {
			errors.push(
				...context.errors.map((error) => ({
					...error,
					field: key
				}))
			);
		}
	}

	if (errors.length > 0) {
		return Err(errors);
	}

	return Ok(data as TValidatorValueMap<GValidators>);
}

type TValidatorValueMap<GValidatorMap extends Record<string, TValidator<any>>> = {
	[K in keyof GValidatorMap]: GValidatorMap[K] extends TValidator<infer GValue> ? GValue : never;
};

type TValidationRecordError<GFieldKeys extends string | number | symbol> = Array<
	{ field: GFieldKeys } & TValidationError
>;
