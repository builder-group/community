import { Err, Ok, type TResult } from 'tuple-result';
import { VersjonError } from '../error';
import type { TJsonObject } from '../json';

/** Parses a `<family>@<version>` reference with an unpadded positive safe integer version. */
export function parseSchemaReference(
	reference: TSchemaReference
): TResult<TSchemaReferenceParts, VersjonError> {
	const match = /^([^@]+)@([1-9]\d*)$/.exec(reference);
	const family = match?.[1];
	const version = match != null ? Number(match[2]) : Number.NaN;
	if (family == null || !Number.isSafeInteger(version)) {
		return Err(
			new VersjonError('#ERR_SCHEMA_REFERENCE', {
				message: `Invalid schema reference ${reference}`
			})
		);
	}

	return Ok({ family, version });
}

/** Reads and validates the `$schema` reference on a JSON object. */
export function readSchemaReference(
	value: TJsonObject
): TResult<TSchemaReferenceParts, VersjonError> {
	const reference = value['$schema'];
	if (typeof reference !== 'string') {
		return Err(
			new VersjonError('#ERR_SCHEMA_REFERENCE', {
				message: 'Schema value requires a $schema reference'
			})
		);
	}

	return parseSchemaReference(reference);
}

/** Formats a family and version without validating either part. */
export function formatSchemaReference(parts: TSchemaReferenceParts): TSchemaReference {
	return `${parts.family}@${parts.version}`;
}

/** Holds a raw reference string. Parse it before relying on its family or version. */
export type TSchemaReference = string;

export interface TSchemaReferenceParts {
	readonly family: string;
	readonly version: number;
}
