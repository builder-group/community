export function deepEqual<T>(value1: T, value2: T): boolean {
	// Handle primitive types and null
	if (typeof value1 !== 'object' || value1 === null) {
		return value1 === value2;
	}

	// If one is null/undefined but not both
	if (value2 === null || typeof value2 !== 'object') {
		return false;
	}

	// Handle arrays
	if (Array.isArray(value1)) {
		if (!Array.isArray(value2) || value1.length !== value2.length) {
			return false;
		}
		return value1.every((item, index) => deepEqual(item, value2[index]));
	}

	// Handle objects
	const keys1 = Object.keys(value1);
	const keys2 = Object.keys(value2 as object);
	if (keys1.length !== keys2.length) {
		return false;
	}
	return keys1.every(
		(key) =>
			Object.prototype.hasOwnProperty.call(value2, key) &&
			deepEqual((value1 as any)[key], (value2 as any)[key])
	);
}
