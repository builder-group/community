import { isObject } from '@ibg/utils';

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis
export function withGlobalBind<T>(key: string, value: T): T {
	if (isObject(globalThis)) {
		(globalThis as Record<string, any>)[key] = value;
	}
	return value;
}
