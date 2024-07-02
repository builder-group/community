export type THexColor = `#${string}`;
export type TRgbColor = [number, number, number];
export type TRgbaColor = [number, number, number, number];
export type TColor = THexColor | TRgbColor | TRgbaColor;

/**
 * A 3x3 column majfor matrix.
 */
export type TMat3 = [TVec3, TVec3, TVec3];

/**
 * A 2x2 column majfor matrix.
 */
export type TMat2 = [TVec2, TVec2];

/**
 * A 2-dimensional vector.
 */
export type TVec2 = [number, number];

/**
 * A 3-dimensional vector.
 */
export type TVec3 = [number, number, number];

export type Unarray<T> = T extends (infer U)[] ? U : T;

export type Unwrap<T> = T extends Promise<infer U> ? U : T;

// https://fettblog.eu/typescript-union-to-intersection/
export type TUnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (
	x: infer R
) => any
	? R
	: never;

export type TPrimitive = boolean | number | string;

// https://github.com/Microsoft/TypeScript/issues/25760
export type TWithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type TEntries<T> = {
	[K in keyof T]: [K, T[K]];
}[keyof T][];
