// https://github.com/dyndotart/monorepo/blob/develop/packages/utils/src/to-array.ts

export function toArray<T>(value: T | T[]): T[] {
	if (Array.isArray(value)) {
		return value;
	}
	return [value];
}
