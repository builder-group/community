/**
 * Recursively replaces `var` properties in a data structure with values from a `placeholders` map.
 *
 * @example
 * ```
 * const originalData = {
 *     name: 'Alice',
 *     details: { age: { var: 'AGE_PLACEHOLDER' }, city: { var: 'CITY_PLACEHOLDER' } },
 *     tags: [{ var: 'AGE_PLACEHOLDER' }, 'student']
 * };
 * const placeholders = { AGE_PLACEHOLDER: 25, CITY_PLACEHOLDER: 'New York' };
 * const newData = deepReplaceVar(originalData, placeholders); // returns { name: 'Alice', details: { age: 25, city: 'New York' }, tags: [25, 'student'] }
 * ```
 */
export function deepReplaceVar<T>(data: T, placeholders: Record<string, unknown>): T {
	return cloneAndReplace(data, placeholders);
}

function cloneAndReplace<T>(item: T, placeholders: Record<string, any>): T {
	if (typeof item === 'object' && item != null) {
		// Check if the item is an object with the `var` key, and replace it
		if (isVarObject(item)) {
			return resolvePlaceholder(item.var, placeholders) as T;
		}
		// Recursively clone and process array elements
		else if (Array.isArray(item)) {
			return item.map((subItem) => cloneAndReplace(subItem, placeholders)) as T;
		}
		// Recursively clone and process object properties
		return Object.keys(item).reduce<Record<string, any>>((acc, key) => {
			acc[key] = cloneAndReplace((item as Record<string, any>)[key], placeholders);
			return acc;
		}, {}) as T;
	}

	// Return primitive and non-targeted object types unchanged
	return item;
}

function isVarObject(value: unknown): value is { var: string } {
	return typeof value === 'object' && value != null && 'var' in value;
}

function resolvePlaceholder(path: string, source: Record<string, any>): any {
	const segments = path.split('.');
	let result = source;
	for (const segment of segments) {
		if (Object.prototype.hasOwnProperty.call(result, segment)) {
			result = result[segment];
		} else {
			return undefined;
		}
	}
	return result;
}
