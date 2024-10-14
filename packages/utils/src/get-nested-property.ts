export type TPrimitive = string | number | boolean | null | undefined;

export type TNestedPath<T> = T extends TPrimitive
	? never
	: T extends any[]
		? never
		: T extends object
			? {
					[K in keyof T]-?: K extends string | number
						? T[K] extends TPrimitive
							? `${K}`
							: `${K}` | `${K}.${TNestedPath<T[K]>}`
						: never;
				}[keyof T & (string | number)]
			: never;

export type TNestedProperty<T, P extends string> = P extends keyof T
	? T[P]
	: P extends `${infer K}.${infer Rest}`
		? K extends keyof T
			? TNestedProperty<T[K], Rest>
			: undefined
		: undefined;

export function getNestedProperty<T, P extends TNestedPath<T>>(
	obj: T,
	path: P
): TNestedProperty<T, P> {
	return path.split('.').reduce((acc: any, key) => {
		return acc == null ? undefined : acc[key];
	}, obj) as TNestedProperty<T, P>;
}
