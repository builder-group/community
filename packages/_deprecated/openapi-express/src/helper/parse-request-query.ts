import type { Query } from 'express-serve-static-core';

export function parseRequestQuery(query: Query): TExpandedQuery {
	const parsedQuery: TExpandedQuery = {};

	for (const key in query) {
		const value = query[key];
		parsedQuery[key] = parseValue(value);
	}

	return parsedQuery;
}

function parseValue(value: Query[keyof Query]): TQueryValue {
	if (typeof value === 'string') {
		return parseString(value);
	} else if (Array.isArray(value)) {
		return value.map((v) => (typeof v === 'string' ? parseString(v) : parseRequestQuery(v)));
	} else if (typeof value === 'object') {
		return parseObject(value);
	}

	return value;
}

function parseString(value: string): string | number | boolean | null | undefined {
	if (value === '') return '';
	if (value === 'null') return null;
	if (value === 'undefined') return undefined;
	if (value === 'true') return true;
	if (value === 'false') return false;

	const numberValue = Number(value);
	if (!isNaN(numberValue)) return numberValue;

	return value;
}

function parseObject(object: Query): TExpandedQuery {
	const parsedObject: TExpandedQuery = {};

	for (const key in object) {
		parsedObject[key] = parseValue(object[key]);
	}

	return parsedObject;
}

type TBaseQueryValue = string | number | boolean | null | undefined;
type TQueryValue =
	| TBaseQueryValue
	| (TBaseQueryValue | TExpandedQuery)[]
	| TBaseQueryValue[]
	| TExpandedQuery[]
	| TExpandedQuery;
// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style -- https://typescript.tv/errors/#ts2456
interface TExpandedQuery {
	[key: string]: TQueryValue;
}
