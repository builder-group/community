import { maybeEncode } from './maybe-encode';

export function serializePrimitiveParam(
	name: string,
	value: unknown,
	allowReserved = true
): string {
	if (value == null) {
		return '';
	} else if (typeof value === 'boolean' || typeof value === 'string' || typeof value === 'number') {
		return `${name}=${maybeEncode(value, allowReserved)}`;
	}

	throw new Error(
		'Deeply-nested arrays and objects are not supported! Provide your own `querySerializer()`.'
	);
}
