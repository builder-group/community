/** Find first match of multiple keys */
export type TFilterKeys<GObject, GMatchers> = GObject[keyof GObject & GMatchers];

export type TUnarray<T> = T extends (infer U)[] ? U : T;

export type TUnwrap<T> = T extends Promise<infer U> ? U : T;

// https://fettblog.eu/typescript-union-to-intersection/
export type TUnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
	k: infer I
) => void
	? I
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

/**
 * Useful to flatten the type output to improve type hints shown in editors. And also to transform an interface into a type to aide with assignability.
 *
 * Copyright: From sindresorhus/type-fest
 */
export type TSimplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

export type TInterfaceToType<T> = T extends Function
	? T
	: { [K in keyof T]: TInterfaceToType<T[K]> };

export type TRequiredKeysOf<BaseType extends object> = Exclude<
	{
		[Key in keyof BaseType]: BaseType extends Record<Key, BaseType[Key]> ? Key : never;
	}[keyof BaseType],
	undefined
>;

export type THasRequiredKeys<BaseType extends object> =
	TRequiredKeysOf<BaseType> extends never ? false : true;

export type TIsAny<T> = boolean extends (T extends never ? true : false) ? true : false;

// https://stackoverflow.com/questions/51808160/keyof-inferring-string-number-when-key-is-only-a-string
export type TExtractString<T> = Extract<T, string>;
