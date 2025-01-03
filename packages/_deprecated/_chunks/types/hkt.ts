// https://dev.to/effect/encoding-of-hkts-in-typescript-5c3

/**
 * Core interface for Higher-Kinded Types (HKTs)
 * Supports up to 4 type parameters (T1, T2, T3, T4)
 */
export interface THKT {
	/** First type parameter */
	readonly _T1?: unknown;

	/** Second type parameter */
	readonly _T2?: unknown;

	/** Third type parameter */
	readonly _T3?: unknown;

	/** Fourth type parameter */
	readonly _T4?: unknown;

	/** The resulting type after applying type parameters */
	readonly type?: unknown;
}

/**
 * Applies type parameters to a Higher-Kinded Type
 * @template GHkt - Base HKT to apply parameters to
 * @template T1 - First type parameter
 * @template T2 - Second type parameter (optional)
 * @template T3 - Third type parameter (optional)
 * @template T4 - Fourth type parameter (optional)
 */
export type TKind<GHkt extends THKT, T1, T2 = unknown, T3 = unknown, T4 = unknown> = GHkt extends {
	readonly type: unknown;
}
	? (GHkt & {
			readonly _T1: T1;
			readonly _T2: T2;
			readonly _T3: T3;
			readonly _T4: T4;
		})['type']
	: {
			readonly _HKT: GHkt;
			readonly _T1: () => T1;
			readonly _T2: () => T2;
			readonly _T3: () => T3;
			readonly _T4: () => T4;
		};

/**
 * Base interface for implementing type classes
 * Ensures proper type inference in generic contexts
 */
export interface TTypeClass<GHkt extends THKT> {
	readonly _GHkt?: GHkt;
}

/**
 * Recursively composes Higher-Kinded Types
 * @template GHKTs - Array of Higher-Kinded Types to compose
 */
export type TCompose<GHKTs extends THKT[]> = GHKTs extends [
	infer GFirst extends THKT,
	...infer GRest extends THKT[]
]
	? GFirst extends { type: unknown }
		? TCompose<GRest> extends never
			? GFirst['type']
			: GFirst['type'] & TCompose<GRest>
		: never
	: unknown;

/**
 * Type guard for checking if a type implements THKT
 */
export type TIsHKT<GType> = GType extends THKT ? true : false;

/**
 * Extracts the first type parameter from an HKT
 */
export type TExtractT1<GHkt extends THKT> = GHkt extends { _T1: infer T1 } ? T1 : never;

/**
 * Extracts the second type parameter from an HKT
 */
export type TExtractT2<GHkt extends THKT> = GHkt extends { _T2: infer T2 } ? T2 : never;

/**
 * Extracts the third type parameter from an HKT
 */
export type TExtractT3<GHkt extends THKT> = GHkt extends { _T3: infer T3 } ? T3 : never;

/**
 * Extracts the fourth type parameter from an HKT
 */
export type TExtractT4<GHkt extends THKT> = GHkt extends { _T4: infer T4 } ? T4 : never;
