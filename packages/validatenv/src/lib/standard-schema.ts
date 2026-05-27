import type { StandardSchemaV1 } from '@standard-schema/spec';
import { formatThrownError } from './format-thrown-error';

/**
 * Runs a Standard Schema validator synchronously and returns a success or failure result.
 * Async validators are rejected immediately with an error.
 */
export function validateStandardSchema<GOutput>(
	validator: StandardSchemaV1<unknown, GOutput>,
	value: unknown,
	options: TValidateStandardSchemaOptions
): TStandardSchemaValidationResult<GOutput> {
	const { envKey, description, example } = options;

	let result: StandardSchemaV1.Result<GOutput> | Promise<StandardSchemaV1.Result<GOutput>>;
	try {
		result = validator['~standard'].validate(value);
	} catch (error) {
		return {
			success: false,
			error: `Error validating ${envKey}: ${formatThrownError(error)}`
		};
	}

	if (isPromiseLike(result)) {
		// Note: Avoid unhandled rejections after reporting that async validators are unsupported
		void Promise.resolve(result).catch(() => undefined);
		return {
			success: false,
			error: `Validator for ${envKey} returned a Promise. validateEnv only supports synchronous Standard Schema validators.`
		};
	}

	if (result.issues != null) {
		return {
			success: false,
			error: formatInvalidEnvError(envKey, result.issues, description, example)
		};
	}

	return {
		success: true,
		value: result.value
	};
}

interface TValidateStandardSchemaOptions {
	envKey: string;
	description?: string;
	example?: string;
}

type TStandardSchemaValidationResult<GValue> =
	| {
			success: true;
			value: GValue;
	  }
	| {
			success: false;
			error: string;
	  };

function formatInvalidEnvError(
	envKey: string,
	issues: readonly StandardSchemaV1.Issue[],
	description?: string,
	example?: string
): string {
	const finalDescription = description != null ? `\nDescription: ${description}` : '';
	const finalExample = example != null ? `\nExample: ${example}` : '';
	const finalIssues =
		issues.length > 0
			? issues.map(formatStandardSchemaIssue).join(', ')
			: 'Unknown validation error';

	return `Invalid value for ${envKey}${finalDescription}${finalExample}\nError: ${finalIssues}`;
}

function formatStandardSchemaIssue(issue: StandardSchemaV1.Issue): string {
	const path = formatStandardSchemaPath(issue.path);
	if (path == null) {
		return issue.message;
	}

	return `${path}: ${issue.message}`;
}

function formatStandardSchemaPath(path: StandardSchemaV1.Issue['path']): string | null {
	if (!path?.length) {
		return null;
	}

	return path
		.map((segment) => (typeof segment === 'object' && 'key' in segment ? segment.key : segment))
		.join('.');
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
	if (typeof value !== 'object' || value == null || !('then' in value)) {
		return false;
	}

	return typeof value.then === 'function';
}

export function isStandardSchemaValidator<GInput, GOutput>(
	value: unknown
): value is StandardSchemaV1<GInput, GOutput> {
	return (
		typeof value === 'object' &&
		value != null &&
		'~standard' in value &&
		typeof value['~standard'] === 'object' &&
		value['~standard'] != null &&
		'validate' in value['~standard'] &&
		typeof value['~standard'].validate === 'function'
	);
}
