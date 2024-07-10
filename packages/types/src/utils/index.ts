/** Find first match of multiple keys */
export type TFilterKeys<GObject, GMatchers> = GObject[keyof GObject & GMatchers];

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

export type TExpect<T extends true> = T;

export type TEqual<X, Y> =
	(<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

export type TNotEqual<X, Y> = true extends TEqual<X, Y> ? false : true;

export type TRequiredKeysOf<GBaseType extends object> = Exclude<
	{
		[Key in keyof GBaseType]: GBaseType extends Record<Key, GBaseType[Key]> ? Key : never;
	}[keyof GBaseType],
	undefined
>;

/** Does this object contain required keys? */
export type THasRequiredKeys<GBaseType extends object> =
	TRequiredKeysOf<GBaseType> extends never ? false : true;

export type TIsAny<T> = boolean extends (T extends never ? true : false) ? true : false;

// https://stackoverflow.com/questions/51808160/keyof-inferring-string-number-when-key-is-only-a-string
export type TExtractString<T> = Extract<T, string>;
