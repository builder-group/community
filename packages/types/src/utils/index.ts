/** Find first match of multiple keys */
export type TFilterKeys<GObject, GMatchers> = GObject[keyof GObject & GMatchers];

/** Filter objects that have required keys */
export type TFindRequiredKeys<T, K extends keyof T> = K extends unknown
	? undefined extends T[K]
		? never
		: K
	: K;

/** Does this object contain required keys? */
export type THasRequiredKeys<T> = TFindRequiredKeys<T, keyof T>;

export type TUnarray<T> = T extends (infer U)[] ? U : T;

export type TUnwrap<T> = T extends Promise<infer U> ? U : T;

// https://fettblog.eu/typescript-union-to-intersection/
export type TUnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (
	x: infer R
) => any
	? R
	: never;

// https://github.com/Microsoft/TypeScript/issues/25760
export type TWithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type TEntries<T> = {
	[K in keyof T]: [K, T[K]];
}[keyof T][];
