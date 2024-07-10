export function parseParams<GParams extends Record<string, unknown>>(params: GParams): GParams {
	const parsedParams: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(params)) {
		parsedParams[key] = parseValue(value);
	}

	return parsedParams as GParams;
}

function parseValue(value: unknown): unknown {
	if (typeof value === 'string') {
		return parseStringValue(value);
	}
	if (Array.isArray(value)) {
		return parseArrayValue(value);
	}
	if (typeof value === 'object' && value != null) {
		return parseObjectValue(value as Record<string, unknown>);
	}
	return value;
}

function parseStringValue(value: string): string | number | boolean | null | undefined {
	if (value === '') return '';
	if (value === 'null') return null;
	if (value === 'undefined') return undefined;
	if (value === 'true') return true;
	if (value === 'false') return false;

	const numberValue = Number(value);
	if (!isNaN(numberValue)) return numberValue;

	return value;
}

function parseObjectValue(object: Record<string, unknown>): Record<string, unknown> {
	const parsedObject: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(object)) {
		parsedObject[key] = parseValue(value);
	}

	return parsedObject;
}

function parseArrayValue(array: unknown[]): unknown[] {
	return array.map(parseValue);
}
