/** Deeply copies plain objects and arrays. Non-plain objects (class instances, Date, Map, etc.) are returned by reference. */
export function deepCopy<GValue>(value: GValue): GValue {
	if (typeof value !== 'object' || value == null) {
		return value;
	}

	if (Array.isArray(value)) {
		return value.map((item) => deepCopy(item)) as GValue;
	}

	// Note: Non-plain objects are returned by reference rather than mangled into plain objects
	if (Object.getPrototypeOf(value) !== Object.prototype) {
		return value;
	}

	const copiedObject: Record<string, unknown> = {};
	for (const key of Object.keys(value)) {
		copiedObject[key] = deepCopy((value as Record<string, unknown>)[key]);
	}

	return copiedObject as GValue;
}
