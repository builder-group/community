export function deepCopy<T>(value: T): T {
	// Handle primitive type and null
	if (typeof value !== 'object' || value === null) {
		return value;
	}

	// Handle array
	if (Array.isArray(value)) {
		return value.map((item) => deepCopy(item)) as unknown as T;
	}

	// Handle object
	const copiedObj: any = {};
	for (const key in value) {
		if (Object.prototype.hasOwnProperty.call(value, key)) {
			copiedObj[key] = deepCopy((value as Record<string, any>)[key]);
		}
	}
	return copiedObj as T;
}
