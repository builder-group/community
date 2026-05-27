import type { StandardSchemaV1 } from '@standard-schema/spec';
import {
	type TCollectErrorMode,
	type TValidationPath,
	type TValidationStatusValue
} from '../types';

/** Runs a Standard Schema validator and converts its issues into a validation status. */
export async function validateStandardSchema<GValue>(
	schema: StandardSchemaV1<GValue, unknown>,
	value: GValue,
	collectErrorMode: TCollectErrorMode
): Promise<TValidationStatusValue> {
	const { issues } = await schema['~standard'].validate(value);
	if (!issues?.length) {
		return { type: 'valid' };
	}

	const collectedIssues = collectErrorMode === 'firstError' ? issues.slice(0, 1) : issues;
	return {
		type: 'invalid',
		errors: collectedIssues.map((issue) => ({
			message: issue.message,
			path: standardSchemaPathToValidationPath(issue.path)
		}))
	};
}

function standardSchemaPathToValidationPath(
	path: StandardSchemaV1.Issue['path']
): TValidationPath | undefined {
	if (!path?.length) {
		return undefined;
	}
	return path.map((segment) =>
		typeof segment === 'object' && 'key' in segment ? segment.key : segment
	);
}
