export function deepCopy<T>(value: T): T {
	if (typeof value !== 'object' || value === null) {
		return value;
	}

	if (Array.isArray(value)) {
		return value.map((item) => deepCopy(item)) as unknown as T;
	}

	const copiedObj: any = {};
	for (const key in value) {
		if (Object.prototype.hasOwnProperty.call(value, key)) {
			copiedObj[key] = deepCopy((value as Record<string, any>)[key]);
		}
	}

	return copiedObj as T;
}
