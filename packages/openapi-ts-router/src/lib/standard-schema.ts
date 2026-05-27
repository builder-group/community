import type { StandardSchemaV1 } from '@standard-schema/spec';
import { OpenApiRouterError } from '../errors';
import type {
	TOpenApiValidationIssue,
	TOpenApiValidationPath,
	TOpenApiValidationSource
} from '../types';

/**
 * Runs a Standard Schema validator for one request part.
 * Validation failures return issues; validator exceptions throw `OpenApiRouterError`.
 */
export async function validateStandardSchema<GOutput>(
	schema: StandardSchemaV1<unknown, GOutput>,
	value: unknown,
	source: TOpenApiValidationSource
): Promise<TStandardSchemaValidationResult<GOutput>> {
	let result: StandardSchemaV1.Result<GOutput>;
	try {
		result = await schema['~standard'].validate(value);
	} catch (error) {
		throw new OpenApiRouterError('#ERR_OPENAPI_SCHEMA', {
			message: `Failed to validate ${source}.`,
			cause: error
		});
	}

	if (result.issues != null) {
		return {
			success: false,
			issues: standardSchemaIssuesToValidationIssues(result.issues, source)
		};
	}

	return {
		success: true,
		value: result.value
	};
}

type TStandardSchemaValidationResult<GValue> =
	| {
			success: true;
			value: GValue;
	  }
	| {
			success: false;
			issues: TOpenApiValidationIssue[];
	  };

function standardSchemaIssuesToValidationIssues(
	issues: readonly StandardSchemaV1.Issue[],
	source: TOpenApiValidationSource
): TOpenApiValidationIssue[] {
	if (!issues.length) {
		return [{ source, message: `Invalid ${source}.` }];
	}

	return issues.map((issue) => ({
		source,
		message: issue.message,
		path: standardSchemaPathToValidationPath(issue.path)
	}));
}

function standardSchemaPathToValidationPath(
	path: StandardSchemaV1.Issue['path']
): TOpenApiValidationPath | undefined {
	if (!path?.length) {
		return undefined;
	}

	return path.map((segment) =>
		typeof segment === 'object' && 'key' in segment ? segment.key : segment
	);
}
