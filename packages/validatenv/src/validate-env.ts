import { formatThrownError, isStandardSchemaValidator, validateStandardSchema } from './lib';
import {
	type TEnv,
	type TEnvData,
	type TEnvDefaultFn,
	type TEnvSpec,
	type TEnvSpecs,
	type TEnvValidator
} from './types';

/** Validates environment variables and throws one error containing every failed variable. */
export function validateEnv<GSpecs extends Record<string, unknown>>(
	env: TEnv,
	specs: TEnvSpecs<GSpecs>
): TEnvData<GSpecs> {
	const envData: Partial<TEnvData<GSpecs>> = {};
	const errors: string[] = [];

	for (const outputKey of Object.keys(specs) as Array<keyof GSpecs & string>) {
		const specValue = specs[outputKey];
		if (!isStandardSchemaValidator(specValue) && !isEnvSpecLike(specValue)) {
			envData[outputKey] = specValue as TEnvData<GSpecs>[typeof outputKey];
			continue;
		}

		const resolvedSpec = resolveEnvSpec(outputKey, specValue);
		if (!resolvedSpec.success) {
			errors.push(resolvedSpec.error);
			continue;
		}

		const validationResult = validateEnvSpec(resolvedSpec.spec, env);
		if (!validationResult.success) {
			errors.push(validationResult.error);
			continue;
		}

		envData[outputKey] = validationResult.value as TEnvData<GSpecs>[typeof outputKey];
	}

	if (errors.length > 0) {
		throw new Error(`Environment validation failed:\n\n${errors.join('\n\n')}`);
	}

	return envData as TEnvData<GSpecs>;
}

/** Validates one environment variable and throws when validation fails. */
export function validateEnvVar<GInput, GOutput>(
	env: TEnv,
	envKey: string,
	spec: TEnvValidator<GInput, GOutput> | Omit<TEnvSpec<GInput, GOutput>, 'envKey'>
): GOutput;
export function validateEnvVar<GInput, GOutput>(
	env: TEnv,
	spec: TEnvSpecWithEnvKey<GInput, GOutput>
): GOutput;
export function validateEnvVar<GInput, GOutput>(
	env: TEnv,
	specOrEnvKey: string | TEnvSpecWithEnvKey<GInput, GOutput>,
	spec?: TEnvValidator<GInput, GOutput> | Omit<TEnvSpec<GInput, GOutput>, 'envKey'>
): GOutput {
	const isKeySpec = typeof specOrEnvKey === 'string';
	const resolvedSpec = isKeySpec
		? resolveEnvSpec<GInput, GOutput>(specOrEnvKey, spec)
		: resolveEnvSpec<GInput, GOutput>(specOrEnvKey.envKey, specOrEnvKey);
	if (!resolvedSpec.success) {
		throw new Error(`Environment validation failed: ${resolvedSpec.error}`);
	}

	const result = validateEnvSpec(resolvedSpec.spec, env);
	if (!result.success) {
		throw new Error(`Environment validation failed: ${result.error}`);
	}

	return result.value;
}

type TEnvSpecWithEnvKey<GInput, GOutput> = TEnvSpec<GInput, GOutput> & {
	envKey: string;
};

function resolveEnvSpec<GInput, GOutput>(
	outputKey: string,
	specValue: unknown
): TResolveEnvSpecResult<GInput, GOutput> {
	if (isStandardSchemaValidator<GInput, GOutput>(specValue)) {
		return {
			success: true,
			spec: {
				envKey: outputKey,
				validator: specValue
			}
		};
	}

	if (!isEnvSpecLike<GInput, GOutput>(specValue)) {
		return {
			success: false,
			error: `Spec for ${outputKey} must be a Standard Schema validator or env spec.`
		};
	}

	const { validator, envKey = outputKey } = specValue;
	if (!isStandardSchemaValidator<GInput, GOutput>(validator)) {
		return {
			success: false,
			error: `Validator for ${outputKey} must implement the Standard Schema interface.`
		};
	}

	return {
		success: true,
		spec: {
			...specValue,
			envKey,
			validator
		}
	};
}

type TResolveEnvSpecResult<GInput, GOutput> =
	| {
			success: true;
			spec: TEnvSpecWithEnvKey<GInput, GOutput>;
	  }
	| {
			success: false;
			error: string;
	  };

function isEnvSpecLike<GInput, GOutput>(
	value: unknown
): value is TEnvSpecCandidate<GInput, GOutput> {
	return typeof value === 'object' && value != null && 'validator' in value;
}

type TEnvSpecCandidate<GInput, GOutput> = Omit<TEnvSpec<GInput, GOutput>, 'validator'> & {
	validator: unknown;
};

function validateEnvSpec<GInput, GOutput>(
	spec: TEnvSpecWithEnvKey<GInput, GOutput>,
	env: TEnv
): TEnvSpecValidationResult<GOutput> {
	const { validator, defaultValue, preprocess, description, example, envKey } = spec;
	let value: unknown = env[envKey];

	// Preprocess
	if (preprocess != null) {
		try {
			value = preprocess(value);
		} catch (error) {
			return {
				success: false,
				error: `Error preprocessing ${envKey}: ${formatThrownError(error)}`
			};
		}
	}

	// Apply default
	if (value === undefined) {
		try {
			value =
				typeof defaultValue === 'function'
					? (defaultValue as TEnvDefaultFn<GInput>)(env)
					: defaultValue;
		} catch (error) {
			return {
				success: false,
				error: `Error evaluating default value for ${envKey}: ${formatThrownError(error)}`
			};
		}
	}

	// Validate
	return validateStandardSchema<GOutput>(validator, value, {
		envKey,
		description,
		example
	});
}

type TEnvSpecValidationResult<GOutput> =
	| {
			success: true;
			value: GOutput;
	  }
	| {
			success: false;
			error: string;
	  };
