import { createValidationContext, TValidationError } from 'validation-adapter';
import {
	TDefaultValueFn,
	TEnvData,
	TEnvSpec,
	TEnvSpecs,
	TEnvSpecValue,
	TEnvSpecWithEnvKey
} from './types';

export function validateEnv<GEnvData extends TEnvData>(
	env: NodeJS.ProcessEnv,
	specs: TEnvSpecs<GEnvData>
): GEnvData {
	const result: Partial<GEnvData> = {};
	const errors: string[] = [];

	for (const [recordKey, spec] of Object.entries(specs) as [
		keyof GEnvData,
		TEnvSpecValue<GEnvData[keyof GEnvData]>
	][]) {
		if (!isEnvSpec(spec)) {
			result[recordKey] = spec as GEnvData[keyof GEnvData];
			continue;
		}

		const processResult = processEnvVar({ ...spec, envKey: spec.envKey ?? String(recordKey) }, env);
		if (!processResult.success) {
			errors.push(processResult.error);
			continue;
		}
		result[recordKey] = processResult.value;
	}

	if (errors.length > 0) {
		throw new Error(`Environment validation failed:\n\n${errors.join('\n\n')}`);
	}

	return result as GEnvData;
}

export function validateEnvVar<GValue>(
	spec: TEnvSpecWithEnvKey<GValue>,
	env: NodeJS.ProcessEnv = process.env
): GValue {
	const result = processEnvVar(spec, env);
	if (!result.success) {
		throw new Error(`Environment validation failed: ${result.error}`);
	}
	return result.value;
}

function processEnvVar<GValue>(
	spec: TEnvSpecWithEnvKey<GValue>,
	env: NodeJS.ProcessEnv
): { success: true; value: GValue } | { success: false; error: string } {
	const { validator, defaultValue, middlewares = [], description, example, envKey } = spec;
	const rawValue = env[String(envKey)];
	let value: unknown = rawValue;

	// Apply middlewares if any
	if (middlewares.length > 0) {
		for (const middleware of middlewares) {
			value = middleware(value as string);
		}
	}

	// Handle undefined values with defaultValue
	if (value === undefined) {
		if (typeof defaultValue === 'function') {
			try {
				value = (defaultValue as TDefaultValueFn<GValue>)(env);
			} catch (error) {
				return {
					success: false,
					error: `Error evaluating default value for ${String(envKey)}: ${error}`
				};
			}
		} else if (defaultValue !== undefined) {
			value = defaultValue;
		}
	}

	const validationContext = createValidationContext<GValue>(value as GValue);
	validator.validate(validationContext);

	if (validationContext.hasError()) {
		const finalDescription = description != null ? `\nDescription: ${description}` : '';
		const finalExample = example != null ? `\nExample: ${example}` : '';
		const finalErrors = `\nError: ${validationContext.errors
			.map((e: TValidationError) => e.message)
			.join(', ')}`;

		return {
			success: false,
			error: `Invalid value for ${String(envKey)}${finalDescription}${finalExample}${finalErrors}`
		};
	}

	return {
		success: true,
		value: validationContext.value as GValue
	};
}

function isEnvSpec<GValue>(value: TEnvSpecValue<GValue>): value is TEnvSpec<GValue> {
	return typeof value === 'object' && value != null && 'validator' in value;
}
