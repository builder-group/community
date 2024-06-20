export function hasProperty<T extends object, K extends string | number | symbol>(
	obj: unknown,
	key: K
): obj is T & Record<K, unknown> {
	return typeof obj === 'object' && obj !== null && key in obj;
}
