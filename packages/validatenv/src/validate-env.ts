import { createValidationContext, TValidationError } from 'validation-adapter';
import { TDefaultValueFn, TEnvData, TEnvSpec, TEnvSpecs } from './types';

export function validateEnv<GEnvData extends TEnvData>(
	env: NodeJS.ProcessEnv,
	specs: TEnvSpecs<GEnvData>
): GEnvData {
	const result: Partial<GEnvData> = {};
	const errors: string[] = [];

	for (const [
		recordKey,
		{ validator, defaultValue, middlewares = [], description, example, key }
	] of Object.entries(specs) as [keyof GEnvData, TEnvSpec<GEnvData[keyof GEnvData]>][]) {
		const rawValue = env[String(key ?? recordKey)];
		let value: unknown = rawValue;

		// Apply middlewares if any
		if (middlewares.length > 0) {
			for (const middleware of middlewares) {
				const transformed = middleware(rawValue);
				if (transformed !== undefined) {
					value = transformed;
					break;
				}
			}
		}

		// Handle undefined values with defaultValue
		if (value === undefined) {
			if (typeof defaultValue === 'function') {
				try {
					value = (defaultValue as TDefaultValueFn<GEnvData[typeof recordKey]>)(env);
				} catch (error) {
					errors.push(`Error evaluating default value for ${String(recordKey)}: ${error}`);
					continue;
				}
			} else if (defaultValue !== undefined) {
				value = defaultValue;
			}
		}

		const validationContext = createValidationContext<GEnvData[typeof recordKey]>(
			value as GEnvData[typeof recordKey]
		);
		validator.validate(validationContext);

		if (validationContext.hasError()) {
			const finalDescription = description != null ? `\nDescription: ${description}` : '';
			const finalExample = example != null ? `\nExample: ${example}` : '';
			const finalErrors = `\nError: ${validationContext.errors
				.map((e: TValidationError) => e.message)
				.join(', ')}`;

			errors.push(
				`Invalid value for ${String(recordKey)}${finalDescription}${finalExample}${finalErrors}`
			);
			continue;
		}

		result[recordKey] = validationContext.value as GEnvData[typeof recordKey];
	}

	if (errors.length > 0) {
		throw new Error(`Environment validation failed:\n\n${errors.join('\n\n')}`);
	}

	return result as GEnvData;
}
